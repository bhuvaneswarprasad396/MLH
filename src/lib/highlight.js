const STOP_WORDS = new Set(['the','and','for','with','that','this','from','have','has','had','was','were','are','not','you','your','their','there','when','which','will','would','should','could','cannot','than','then','them','they','does','did','doing','because','about','into','over','under','error','errors','code','line','lines','file','files','problem','likely','possible','check','make','sure','also','more','most','some','such','only','other','after','before','while','using','used','run','running']);

const clean = (value) => String(value || '').replace(/^[^\w]+|[^\w]+$/g, '');
const compact = (value) => String(value || '').toLowerCase().replace(/[^\w.:/\\-]/g, '');

function diagnosisText(diagnosis) {
  return [diagnosis?.observed_error, diagnosis?.short_title, ...(diagnosis?.evidence_observed || []), ...(diagnosis?.missing_information || [])].filter(Boolean).join('\n');
}

function importantPhrases(text) {
  const found = new Set();
  const add = (value) => { const phrase = String(value || '').replace(/\s+/g, ' ').trim(); if (phrase.length >= 5 && phrase.length <= 100) found.add(phrase); };
  (text.match(/(?:TypeError|ReferenceError|SyntaxError|RangeError)\s*:\s*[^\n]{3,90}/gi) || []).forEach(add);
  (text.match(/argument handler must be a function/gi) || []).forEach(add);
  (text.match(/cannot find module[^\n]{0,80}/gi) || []).forEach(add);
  (text.match(/(?:econnrefused|eaddrinuse|enoent|eacces)\b[^\n]{0,80}/gi) || []).forEach(add);
  (text.match(/["'`]([^"'`]{5,80})["'`]/g) || []).forEach((value) => add(value.slice(1, -1)));
  return [...found];
}

function termsFrom(diagnosis) {
  const text = diagnosisText(diagnosis);
  const phrases = importantPhrases(text);
  const terms = new Set();
  phrases.forEach((phrase) => phrase.split(/\s+/).map(clean).filter((word) => word.length >= 3 && !STOP_WORDS.has(word.toLowerCase())).forEach((word) => terms.add(word)));
  text.split(/[\s,;()[\]]+/).map(clean).forEach((word) => {
    if (word.length < 3 || STOP_WORDS.has(word.toLowerCase())) return;
    if (/[._:/\\-]/.test(word) || /\d/.test(word) || word === word.toUpperCase()) terms.add(word);
  });
  return { terms:[...terms], phraseWords:new Set(phrases.flatMap((phrase) => phrase.split(/\s+/).map(compact).filter((word) => word.length >= 3))) };
}

function scoreWord(word, terms, phraseWords) {
  const value = compact(word.text);
  if (!value) return 0;
  if (phraseWords.has(value)) return 8;
  let best = 0;
  terms.forEach((term) => {
    const needle = compact(term);
    if (!needle) return;
    if (value === needle) best = Math.max(best, 5);
    else if (needle.length >= 5 && (value.includes(needle) || needle.includes(value))) best = Math.max(best, 3);
  });
  return best;
}

export function buildHighlights({ diagnosis, words = [], imageWidth, imageHeight, max = 6 }) {
  if (!diagnosis || !words.length) return [];
  const { terms, phraseWords } = termsFrom(diagnosis);
  if (!terms.length) return [];
  const scored = words.map((word, index) => ({ word, index, score:scoreWord(word, terms, phraseWords) })).filter((entry) => entry.score >= 3);
  if (!scored.length) return [];
  const height = Math.max(Number(imageHeight) || 0, ...words.map((word) => word.y1), 1);
  const width = Math.max(Number(imageWidth) || 0, ...words.map((word) => word.x1), 1);
  const groups = [];
  scored.forEach((entry) => {
    const last = groups[groups.length - 1];
    const previous = last?.words[last.words.length - 1];
    const wordHeight = previous ? previous.word.y1 - previous.word.y0 + 1 : 1;
    const sameLine = previous && Math.abs(previous.word.y0 - entry.word.y0) < wordHeight * 0.8;
    const adjacent = previous && entry.index - previous.index <= 4;
    if (last && sameLine && adjacent) { last.words.push(entry); last.score = Math.max(last.score, entry.score); }
    else groups.push({ words:[entry], score:entry.score });
  });
  return groups.map((group) => {
    const x0 = Math.min(...group.words.map((entry) => entry.word.x0));
    const y0 = Math.min(...group.words.map((entry) => entry.word.y0));
    const x1 = Math.max(...group.words.map((entry) => entry.word.x1));
    const y1 = Math.max(...group.words.map((entry) => entry.word.y1));
    const label = group.words.map((entry) => entry.word.text).join(' ');
    const exact = group.score >= 8;
    return { id:`${Math.round(x0)}-${Math.round(y0)}-${label.slice(0, 18)}`, label, score:group.score, kind:exact?'evidence':'context', left:(x0 / width) * 100, top:(y0 / height) * 100, width:((x1 - x0) / width) * 100, height:((y1 - y0) / height) * 100, explanation:exact ? `Exact error text detected on screen: “${label}”.` : `Related technical evidence on screen: “${label}”.` };
  }).sort((a,b) => b.score - a.score || a.top - b.top).slice(0,max);
}
