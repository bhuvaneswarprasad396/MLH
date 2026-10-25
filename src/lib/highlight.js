const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'had', 'was', 'were', 'are', 'not', 'you', 'your',
  'their', 'there', 'when', 'which', 'will', 'would', 'should', 'could', 'cannot', 'than', 'then', 'them', 'they',
  'does', 'did', 'doing', 'because', 'about', 'into', 'over', 'under', 'error', 'errors', 'code', 'line', 'lines',
  'file', 'files', 'problem', 'likely', 'possible', 'check', 'make', 'sure', 'also', 'more', 'most', 'some', 'such',
  'only', 'other', 'after', 'before', 'while', 'using', 'used', 'run', 'running',
]);

function clean(token) {
  return String(token || '').replace(/^[^\w]+|[^\w]+$/g, '');
}

/** Significant words the diagnosis points at: error strings, identifiers, codes, paths. */
function termsFrom(diagnosis) {
  const text = [
    diagnosis?.observed_error,
    diagnosis?.short_title,
    ...(diagnosis?.evidence_observed || []),
    ...(diagnosis?.missing_information || []),
  ]
    .filter(Boolean)
    .join(' \n ');

  const terms = new Set();
  const quoted = text.match(/["'`]([^"'`]{3,60})["'`]/g) || [];
  quoted.forEach((value) => terms.add(value.replace(/["'`]/g, '').trim()));

  text.split(/[\s,;()[\]]+/).forEach((raw) => {
    const token = clean(raw);
    if (token.length < 3) return;
    const looksTechnical = /[._:/\-\\]/.test(token) || /\d/.test(token) || token === token.toUpperCase();
    if (!looksTechnical) return;
    if (STOP_WORDS.has(token.toLowerCase())) return;
    terms.add(token);
  });

  const loose = text.split(/\s+/).map(clean).filter((token) => token.length >= 6 && !STOP_WORDS.has(token.toLowerCase()));
  loose.slice(0, 8).forEach((token) => terms.add(token));

  return Array.from(terms).slice(0, 26);
}

function scoreWord(word, terms) {
  const value = word.text.toLowerCase().replace(/[^\w.:/\-]/g, '');
  if (!value) return 0;
  let best = 0;
  terms.forEach((term) => {
    const needle = term.toLowerCase().replace(/[^\w.:/\-]/g, '');
    if (!needle) return;
    if (value === needle) best = Math.max(best, 4);
    else if (needle.length >= 4 && (value.includes(needle) || needle.includes(value))) {
      best = Math.max(best, needle === value ? 4 : 2);
    }
  });
  if (!best && /^(eaddr|econn|enot|errno|error|exception|failed|fatal|denied|refused|not found|missing)/i.test(word.text)) {
    best = 1;
  }
  return best;
}

/**
 * Matches OCR words against the diagnosis and returns percentage-based boxes, so the
 * overlay stays aligned at any zoom or container size. No match → no highlight.
 */
export function buildHighlights({ diagnosis, words = [], imageWidth, imageHeight, max = 6 }) {
  if (!diagnosis || !words.length) return [];
  const terms = termsFrom(diagnosis);
  if (!terms.length) return [];

  const scored = words
    .map((word, index) => ({ word, index, score: scoreWord(word, terms) }))
    .filter((entry) => entry.score > 1);

  if (!scored.length) return [];

  const height = Math.max(Number(imageHeight) || 0, ...words.map((word) => word.y1), 1);
  const width = Math.max(Number(imageWidth) || 0, ...words.map((word) => word.x1), 1);

  const groups = [];
  scored.forEach((entry) => {
    const last = groups[groups.length - 1];
    const previous = last?.words[last.words.length - 1];
    const sameLine = previous && Math.abs(previous.word.y0 - entry.word.y0) < (previous.word.y1 - previous.word.y0 + 1) * 0.7;
    const adjacent = previous && entry.index - previous.index <= 3;
    if (last && sameLine && adjacent) {
      last.words.push(entry);
      last.score = Math.max(last.score, entry.score);
      return;
    }
    groups.push({ words: [entry], score: entry.score });
  });

  const merged = groups.map((group) => {
    const x0 = Math.min(...group.words.map((entry) => entry.word.x0));
    const y0 = Math.min(...group.words.map((entry) => entry.word.y0));
    const x1 = Math.max(...group.words.map((entry) => entry.word.x1));
    const y1 = Math.max(...group.words.map((entry) => entry.word.y1));
    const label = group.words.map((entry) => entry.word.text).join(' ');
    return {
      id: `${Math.round(x0)}-${Math.round(y0)}-${label.slice(0, 12)}`,
      label,
      score: group.score,
      kind: group.score >= 4 ? 'evidence' : 'context',
      left: (x0 / width) * 100,
      top: (y0 / height) * 100,
      width: ((x1 - x0) / width) * 100,
      height: ((y1 - y0) / height) * 100,
      explanation:
        group.score >= 4
          ? `This text on screen matches a term in the diagnosis exactly: “${label}”.`
          : `This text on screen is related to the diagnosed problem: “${label}”.`,
    };
  });

  return merged.sort((a, b) => b.score - a.score || a.top - b.top).slice(0, max);
}