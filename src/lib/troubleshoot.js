import { ENGINE_LABEL, callVisionModel } from '@/lib/engine';
import { signPrivateFile, uploadPrivate } from '@/lib/files';
import { measureImage, runOcr } from '@/lib/ocr';
import { SYSTEM_PROMPT, buildAnalysisPrompt, buildFollowUpPrompt, buildReAnalysisPrompt } from '@/lib/prompts';
import {
  DIAGNOSIS_JSON_SCHEMA,
  FOLLOW_UP_JSON_SCHEMA,
  FollowUpSchema,
  appendSteps,
  countAttempted,
  deriveStatus,
  diagnosisToSessionFields,
  mergeStepProgress,
  normalizeDiagnosis,
} from '@/lib/diagnosisSchema';
import { dedupeWarnings, normalizeWarnings, sanitizeUntrusted } from '@/lib/safetyRules';
import { getOcr, getSession, saveSession, setPrefs, storeOcr } from '@/lib/sessionStore';

const MAX_OCR_CHARS = 12000;
const MAX_SCREENSHOTS = 6;

function localId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `s2s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stamp() {
  return new Date().toISOString();
}

function makeMessage(role, kind, content, extra = {}) {
  return { id: localId(), role, kind, content, created_at: stamp(), ...extra };
}

function summaryText(session) {
  return [
    `Problem type: ${session.problem_type || 'unknown'}`,
    `Short title: ${session.short_title || session.title || 'unknown'}`,
    `Visible evidence: ${session.observed_error || 'none recorded'}`,
    `Current status: ${session.verification_status || 'in_progress'}`,
    `Confidence: ${session.confidence_level || 'low'} — ${session.confidence_reason || ''}`,
    `Missing information: ${(session.missing_information || []).join('; ') || 'none recorded'}`,
    `Steps: ${(session.recommended_steps || []).map((step) => `${step.order}. ${step.title}`).join(' | ')}`,
  ].join('\n');
}

function outcomesText(session) {
  const reported = (session.recommended_steps || []).filter((step) => step.attempted || step.outcome || step.user_note);
  if (!reported.length) return 'The user has not reported on any step yet.';
  return reported
    .map((step) => `- “${step.title}”: ${String(step.outcome || 'marked as attempted').replace(/_/g, ' ')}${step.user_note ? ` — user note: ${step.user_note}` : ''}`)
    .join('\n');
}

function conversationText(messages = []) {
  return messages
    .slice(-10)
    .map((item) => `${item.role === 'user' ? 'User' : item.kind === 'system' ? 'System event' : 'Assistant'}: ${item.content}`)
    .join('\n');
}

function requireSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) throw new Error('That session is no longer stored in this browser. Start a new analysis instead.');
  return session;
}

export function getSessionView(sessionId) {
  return getSession(sessionId);
}

export async function viewUrlsFor(session) {
  const map = {};
  for (const shot of session?.screenshots || []) {
    try {
      map[shot.file_uri] = await signPrivateFile(shot.file_uri);
    } catch {
      map[shot.file_uri] = '';
    }
  }
  return map;
}

/** OCR is an evidence layer, not a dependency: if it cannot start, the diagnosis still runs. */
async function runOcrSafely(file, onStage) {
  try {
    const result = await runOcr(file, (info) => onStage?.({ stage: 'ocr', ...info }));
    return { ...result, failed: false };
  } catch {
    const size = await measureImage(file);
    return { text: '', words: [], confidence: 0, width: size.width, height: size.height, failed: true };
  }
}

export async function analyzeScreenshot({ file, language = 'en', note = '', onStage }) {
  onStage?.({ stage: 'ocr', label: 'Reading the text on your screen', progress: 0 });
  const ocr = await runOcrSafely(file, onStage);

  onStage?.({ stage: 'upload', label: 'Saving the screenshot in this browser' });
  const fileUri = await uploadPrivate(file);
  const viewUrl = await signPrivateFile(fileUri);

  onStage?.({ stage: 'model', label: 'Diagnosing the problem from the screenshot' });
  const cleaned = sanitizeUntrusted(ocr.text.slice(0, MAX_OCR_CHARS));
  const raw = await callVisionModel({
    prompt: `${SYSTEM_PROMPT}\n\n${buildAnalysisPrompt({ ocrText: cleaned.text, userNote: note })}`,
    imageUrls: [viewUrl],
    responseSchema: DIAGNOSIS_JSON_SCHEMA,
  });

  const normalized = normalizeDiagnosis(raw);
  const now = stamp();
  const session = {
    id: localId(),
    created_at: now,
    updated_at: now,
    engine: ENGINE_LABEL,
    ...diagnosisToSessionFields(normalized),
    language,
    user_note: note,
    analysis_count: 1,
    attempted_count: 0,
    injection_detected: cleaned.injections.length > 0,
    injection_flags: cleaned.injections,
    ocr_confidence: ocr.confidence,
    screenshots: [
      { file_uri: fileUri, label: 'original', note, added_at: now, width: ocr.width, height: ocr.height },
    ],
    messages: [
      makeMessage(
        'system',
        'system',
        ocr.failed
          ? 'Text detection could not run for this screenshot — the diagnosis relies on the image itself.'
          : `Screenshot analysed — ${ocr.words.length} text elements detected by OCR.`,
      ),
      makeMessage('assistant', 'chat', normalized.diagnosis.plain_language_explanation || normalized.diagnosis.observed_error),
    ],
  };

  saveSession(session);
  storeOcr(session.id, fileUri, ocr);
  setPrefs({ language });
  return session;
}

export async function refreshDiagnosis({ sessionId, language, onStage }) {
  const session = requireSession(sessionId);
  const screenshot = session.screenshots?.[0];
  const ocr = screenshot ? getOcr(sessionId, screenshot.file_uri) : null;
  onStage?.({ stage: 'model', label: 'Refreshing this session from saved evidence' });
  const cleaned = sanitizeUntrusted(String(ocr?.words?.map((word) => word.text).join(' ') || session.observed_error || '').slice(0, MAX_OCR_CHARS));
  const raw = await callVisionModel({ prompt: `${SYSTEM_PROMPT}\n\n${buildAnalysisPrompt({ ocrText: cleaned.text, userNote: session.user_note || '' })}`, responseSchema: DIAGNOSIS_JSON_SCHEMA });
  const normalized = normalizeDiagnosis(raw);
  const next = { ...session, ...diagnosisToSessionFields(normalized), language: language || session.language, updated_at: stamp(), messages: [...(session.messages || []), makeMessage('system', 'system', 'Diagnosis, steps, and voice script refreshed from saved evidence.')] };
  saveSession(next);
  return next;
}
export async function postMessage({ sessionId, text, language, onStage }) {
  const session = requireSession(sessionId);
  onStage?.({ stage: 'model', label: 'Working through your answer' });

  const userMessage = makeMessage('user', 'chat', text);
  const raw = await callVisionModel({
    prompt: `${SYSTEM_PROMPT}\n\n${buildFollowUpPrompt({
      summary: summaryText(session),
      outcomes: outcomesText(session),
      conversation: conversationText(session.messages),
      userMessage: text,
    })}`,
    responseSchema: FOLLOW_UP_JSON_SCHEMA,
  });

  const parsed = FollowUpSchema.parse(raw || {});
  let steps = session.recommended_steps || [];
  let warnings = session.safety_warnings || [];

  if (parsed.additional_steps?.length) {
    const appended = appendSteps(steps, parsed.additional_steps);
    steps = appended.steps;
    warnings = [...warnings, ...appended.warnings];
  }
  warnings = dedupeWarnings([...warnings, ...normalizeWarnings(parsed.safety_warnings || [])]);

  const voice = parsed.voice_scripts || {};
  const voice_scripts = {
    en: voice.en || session.voice_scripts?.en || '',
    gu: voice.gu || session.voice_scripts?.gu || '',
    te: voice.te || session.voice_scripts?.te || '',
  };

  const next = {
    ...session,
    recommended_steps: steps,
    safety_warnings: warnings,
    voice_scripts,
    missing_information: parsed.missing_information || session.missing_information,
    verification_status: parsed.verification_status || deriveStatus(session, steps),
    attempted_count: countAttempted(steps),
    language: language || session.language,
    updated_at: stamp(),
    messages: [
      ...(session.messages || []),
      userMessage,
      makeMessage('assistant', 'chat', parsed.reply || 'I could not produce an answer for that. Try rephrasing it.'),
    ],
  };

  saveSession(next);
  return next;
}

export async function addScreenshot({ sessionId, file, label = 'after', note = '', onStage }) {
  const session = requireSession(sessionId);
  if ((session.screenshots || []).length >= MAX_SCREENSHOTS) {
    throw new Error(`This session already holds ${MAX_SCREENSHOTS} screenshots. Start a new analysis for more.`);
  }

  onStage?.({ stage: 'ocr', label: 'Reading the text in the new screenshot', progress: 0 });
  const ocr = await runOcrSafely(file, onStage);

  onStage?.({ stage: 'upload', label: 'Saving the new screenshot in this browser' });
  const fileUri = await uploadPrivate(file);
  const viewUrl = await signPrivateFile(fileUri);

  onStage?.({ stage: 'model', label: 'Re-checking the diagnosis against the new evidence' });
  const cleaned = sanitizeUntrusted(ocr.text.slice(0, MAX_OCR_CHARS));
  const raw = await callVisionModel({
    prompt: `${SYSTEM_PROMPT}\n\n${buildReAnalysisPrompt({
      summary: summaryText(session),
      outcomes: outcomesText(session),
      label,
      ocrText: cleaned.text,
      note,
    })}`,
    imageUrls: [viewUrl],
    responseSchema: DIAGNOSIS_JSON_SCHEMA,
  });

  const normalized = normalizeDiagnosis(raw);
  const fields = diagnosisToSessionFields(normalized);
  const steps = mergeStepProgress(session.recommended_steps || [], fields.recommended_steps);

  const next = {
    ...session,
    ...fields,
    recommended_steps: steps,
    attempted_count: countAttempted(steps),
    analysis_count: (session.analysis_count || 1) + 1,
    injection_detected: session.injection_detected || cleaned.injections.length > 0,
    screenshots: [
      ...(session.screenshots || []),
      { file_uri: fileUri, label, note, added_at: stamp(), width: ocr.width, height: ocr.height },
    ],
    updated_at: stamp(),
    messages: [
      ...(session.messages || []),
      makeMessage(
        'system',
        'evidence',
        `Added a new “${label}” screenshot — ${
          ocr.failed ? 'text detection was unavailable for it' : `${ocr.words.length} text elements detected`
        }.`,
      ),
      makeMessage('assistant', 'chat', fields.plain_language_explanation || 'The new screenshot was re-assessed.'),
    ],
  };

  saveSession(next);
  storeOcr(next.id, fileUri, ocr);
  return next;
}

export function requestAlternative({ sessionId, stepId }) {
  const session = requireSession(sessionId);
  const original = (session.recommended_steps || []).find((step) => step.id === stepId);
  const title = session.short_title || session.title || '';
  let alternative;
  if (/AI service request failed/i.test(title)) {
    alternative = { title: 'Verify provider model access', instructions: 'Open the Hugging Face account settings and confirm the selected model is enabled for the account. Keep access tokens private and do not paste them into the app.', expected_result: 'You can confirm whether the selected model is available to the account.', risk_level: 'read_only', command: null, why_it_helps: 'Provider requests fail when a token is missing, expired, or the model is not permitted.' };
  } else if (/speech voice/i.test(title)) {
    alternative = { title: 'Use an installed matching voice', instructions: 'Select a listed voice in the Voice tab, or install the selected language speech feature in Windows and restart the browser.', expected_result: 'A matching voice appears in the dropdown and playback starts.', risk_level: 'read_only', command: null, why_it_helps: 'The browser can only speak voices installed on the device.' };
  } else if (/Package|dependency/i.test(title)) {
    alternative = { title: 'Inspect the named dependency', instructions: 'Check which package requested the dependency before reinstalling anything.', expected_result: 'You identify the package and version conflict.', risk_level: 'read_only', command: null, why_it_helps: 'Targeted information avoids unnecessary reinstalling.' };
  } else {
    alternative = { title: 'Capture the exact result', instructions: 'Paste the exact message shown after the previous step and state what action you took.', expected_result: 'The next recommendation can use specific evidence.', risk_level: 'read_only', command: null, why_it_helps: 'A useful alternative depends on the observed result.' };
  }
  const appended = appendSteps(session.recommended_steps || [], [alternative]);
  const message = `Alternative added for step ${original?.order || ''} “${original?.title || 'selected step'}”: ${alternative.title}.`;
  const next = { ...session, recommended_steps: appended.steps, safety_warnings: dedupeWarnings([...(session.safety_warnings || []), ...appended.warnings]), attempted_count: countAttempted(appended.steps), updated_at: stamp(), messages: [...(session.messages || []), makeMessage('assistant', 'chat', message)] };
  saveSession(next);
  return next;
}
export function patchStep({ sessionId, stepId, patch }) {
  const session = requireSession(sessionId);
  const steps = (session.recommended_steps || []).map((step) => (step.id === stepId ? { ...step, ...patch } : step));
  const target = steps.find((step) => step.id === stepId);
  const events = [];

  if (patch.outcome !== undefined && target) {
    const outcome = String(patch.outcome || 'skipped').replace(/_/g, ' ');
    events.push(
      makeMessage(
        'system',
        'system',
        `Step ${target.order} “${target.title}” reported as ${outcome}${target.user_note ? ` — “${target.user_note}”` : ''}.`,
      ),
    );
  }

  const next = {
    ...session,
    recommended_steps: steps,
    verification_status: deriveStatus(session, steps),
    attempted_count: countAttempted(steps),
    updated_at: stamp(),
    messages: [...(session.messages || []), ...events],
  };

  saveSession(next);
  return next;
}