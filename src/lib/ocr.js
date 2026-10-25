import { createWorker } from 'tesseract.js';

const WORKER_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js';
const CORE_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5';
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0';

const STATUS_LABELS = {
  'loading tesseract core': 'Loading the OCR engine',
  'initializing tesseract': 'Starting the OCR engine',
  'loading language traineddata': 'Loading the English language model',
  'initializing api': 'Preparing text recognition',
  'recognizing text': 'Reading the text on screen',
};

function collectWords(node, out) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node.symbols)) {
    out.push(node);
    return out;
  }
  ['blocks', 'paragraphs', 'lines', 'words'].forEach((key) => {
    if (Array.isArray(node[key])) node[key].forEach((child) => collectWords(child, out));
  });
  return out;
}

function toWords(data) {
  const raw = Array.isArray(data?.words) && data.words.length ? data.words : collectWords(data?.blocks, []);
  return raw
    .filter((word) => word?.text?.trim() && word?.bbox)
    .map((word) => ({
      text: word.text.trim(),
      confidence: word.confidence ?? 0,
      x0: word.bbox.x0,
      y0: word.bbox.y0,
      x1: word.bbox.x1,
      y1: word.bbox.y1,
    }));
}

export function measureImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Runs OCR in the browser: nothing is uploaded to read the text. */
export async function runOcr(file, onProgress) {
  const worker = await createWorker('eng', 1, {
    workerPath: WORKER_PATH,
    corePath: CORE_PATH,
    langPath: LANG_PATH,
    logger: (message) => {
      const label = STATUS_LABELS[message?.status] || 'Reading the screenshot';
      const value = message?.status === 'recognizing text' ? Math.round((message.progress || 0) * 100) : null;
      onProgress?.({ label, progress: value });
    },
  });
  try {
    const result = await worker.recognize(file, {}, { text: true, blocks: true });
    const data = result?.data || {};
    const words = toWords(data);
    const size = await measureImage(file);
    return {
      text: String(data.text || '').trim(),
      words,
      confidence: Math.round(data.confidence || 0),
      width: size.width,
      height: size.height,
    };
  } finally {
    await worker.terminate();
  }
}