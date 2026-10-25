import { z } from 'zod';
import { dedupeWarnings, hardenSteps, normalizeWarnings } from '@/lib/safetyRules';

const CAUSE_STRENGTHS = ['strong', 'plausible', 'speculative'];
const STATUSES = ['needs_more_information', 'in_progress', 'partially_resolved', 'resolved', 'unresolved'];

export const CATEGORIES = [
  'ide_compiler',
  'terminal_cli',
  'browser_web',
  'git_version_control',
  'package_manager',
  'database',
  'install_config',
  'os_dialog',
  'network',
  'hardware',
  'security',
  'other',
];

const CauseSchema = z.object({
  cause: z.string().default(''),
  reasoning: z.string().default(''),
  evidence_strength: z.enum(CAUSE_STRENGTHS).catch('plausible'),
});

const StepSchema = z.object({
  title: z.string().default('Untitled step'),
  instructions: z.string().default(''),
  expected_result: z.string().default(''),
  risk_level: z.string().default('low'),
  command: z.string().nullish().catch(null),
  why_it_helps: z.string().nullish().catch(null),
});

const WarningSchema = z.object({
  level: z.string().default('caution'),
  message: z.string().default(''),
  safer_alternative: z.string().nullish().catch(null),
});

const VoiceSchema = z.object({
  en: z.string().default(''),
  gu: z.string().default(''),
  te: z.string().default(''),
});

export const DiagnosisSchema = z.object({
  problem_type: z.string().default('other'),
  short_title: z.string().default('Unidentified problem'),
  observed_error: z.string().default(''),
  plain_language_explanation: z.string().default(''),
  evidence_observed: z.array(z.string()).default([]),
  likely_causes: z.array(CauseSchema).default([]),
  confidence_level: z.enum(['high', 'medium', 'low']).catch('low'),
  confidence_reason: z.string().default(''),
  missing_information: z.array(z.string()).default([]),
  clarifying_question: z.string().nullish().catch(null),
  recommended_steps: z.array(StepSchema).default([]),
  safety_warnings: z.array(WarningSchema).default([]),
  verification_instructions: z.string().default(''),
  verification_status: z.enum(STATUSES).catch('in_progress'),
  voice_scripts: VoiceSchema.default({}),
});

export const FollowUpSchema = z.object({
  reply: z.string().default(''),
  verification_status: z.enum(STATUSES).nullish().catch(null),
  missing_information: z.array(z.string()).nullish().catch(null),
  additional_steps: z.array(StepSchema).nullish().catch(null),
  safety_warnings: z.array(WarningSchema).nullish().catch(null),
  voice_scripts: VoiceSchema.partial().nullish().catch(null),
});

/** The JSON contract handed to the model as a response schema. */
export const DIAGNOSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    problem_type: { type: 'string' },
    short_title: { type: 'string' },
    observed_error: { type: 'string' },
    plain_language_explanation: { type: 'string' },
    evidence_observed: { type: 'array', items: { type: 'string' } },
    likely_causes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cause: { type: 'string' },
          reasoning: { type: 'string' },
          evidence_strength: { type: 'string' },
        },
      },
    },
    confidence_level: { type: 'string' },
    confidence_reason: { type: 'string' },
    missing_information: { type: 'array', items: { type: 'string' } },
    clarifying_question: { type: 'string' },
    recommended_steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          instructions: { type: 'string' },
          expected_result: { type: 'string' },
          risk_level: { type: 'string' },
          command: { type: 'string' },
          why_it_helps: { type: 'string' },
        },
      },
    },
    safety_warnings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          level: { type: 'string' },
          message: { type: 'string' },
          safer_alternative: { type: 'string' },
        },
      },
    },
    verification_instructions: { type: 'string' },
    verification_status: { type: 'string' },
    voice_scripts: {
      type: 'object',
      properties: { en: { type: 'string' }, gu: { type: 'string' }, te: { type: 'string' } },
    },
  },
};

export const FOLLOW_UP_JSON_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    verification_status: { type: 'string' },
    missing_information: { type: 'array', items: { type: 'string' } },
    additional_steps: DIAGNOSIS_JSON_SCHEMA.properties.recommended_steps,
    safety_warnings: DIAGNOSIS_JSON_SCHEMA.properties.safety_warnings,
    voice_scripts: DIAGNOSIS_JSON_SCHEMA.properties.voice_scripts,
  },
};

function normalizeProblemType(value) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (CATEGORIES.includes(slug)) return slug;
  const hints = [
    [/ide|compil|build|typescript|java|rust|syntax/, 'ide_compiler'],
    [/terminal|shell|cli|command|permission|port|process|runtime/, 'terminal_cli'],
    [/browser|web|http|url|website|ssl|cors|page/, 'browser_web'],
    [/git|version_control|merge|branch|commit/, 'git_version_control'],
    [/npm|yarn|pip|depend|package|module|node/, 'package_manager'],
    [/database|sql|postgres|mysql|mongo|redis/, 'database'],
    [/install|config|setup|environment|env/, 'install_config'],
    [/os_|dialog|driver|update|windows|macos|linux/, 'os_dialog'],
    [/network|dns|proxy|firewall|socket/, 'network'],
    [/hardware|disk|ram|gpu|memory/, 'hardware'],
    [/security|certificate|auth|secret/, 'security'],
  ];
  const hit = hints.find(([pattern]) => pattern.test(slug));
  return hit ? hit[1] : 'other';
}

export function normalizeDiagnosis(raw) {
  const parsed = DiagnosisSchema.parse(raw || {});
  const { steps, warnings } = hardenSteps(parsed.recommended_steps);
  const voice_scripts = {
    en: parsed.voice_scripts.en || parsed.plain_language_explanation,
    gu: parsed.voice_scripts.gu || parsed.voice_scripts.en || parsed.plain_language_explanation,
    te: parsed.voice_scripts.te || parsed.voice_scripts.en || parsed.plain_language_explanation,
  };
  const diagnosis = {
    ...parsed,
    problem_type: normalizeProblemType(parsed.problem_type),
    clarifying_question: parsed.clarifying_question || '',
    voice_scripts,
  };
  return {
    diagnosis,
    steps,
    warnings: dedupeWarnings([...warnings, ...normalizeWarnings(parsed.safety_warnings)]),
  };
}

export function diagnosisToSessionFields({ diagnosis, steps, warnings }) {
  return {
    title: diagnosis.short_title,
    problem_type: diagnosis.problem_type,
    short_title: diagnosis.short_title,
    observed_error: diagnosis.observed_error,
    plain_language_explanation: diagnosis.plain_language_explanation,
    evidence_observed: diagnosis.evidence_observed,
    inferred_causes: diagnosis.likely_causes.map((cause) => cause.cause).filter(Boolean),
    likely_causes: diagnosis.likely_causes,
    confidence_level: diagnosis.confidence_level,
    confidence_reason: diagnosis.confidence_reason,
    missing_information: diagnosis.missing_information,
    clarifying_question: diagnosis.clarifying_question,
    recommended_steps: steps,
    safety_warnings: warnings,
    verification_instructions: diagnosis.verification_instructions,
    verification_status: diagnosis.verification_status,
    voice_scripts: diagnosis.voice_scripts,
  };
}

/** Keeps what the user already reported when a re-analysis returns the same steps. */
export function mergeStepProgress(previous = [], incoming = []) {
  const byTitle = new Map(previous.map((step) => [String(step.title || '').toLowerCase().trim(), step]));
  return incoming.map((step) => {
    const match = byTitle.get(String(step.title || '').toLowerCase().trim());
    if (!match) return step;
    return {
      ...step,
      id: match.id || step.id,
      attempted: Boolean(match.attempted),
      outcome: match.outcome || '',
      user_note: match.user_note || '',
    };
  });
}

/** Adds steps a follow-up produced, hardened exactly like the originals. */
export function appendSteps(existing = [], extra = []) {
  const known = new Set(existing.map((step) => String(step.title || '').toLowerCase().trim()));
  const fresh = extra.filter((step) => !known.has(String(step.title || '').toLowerCase().trim()));
  if (!fresh.length) return { steps: existing, warnings: [] };
  const { steps, warnings } = hardenSteps(fresh, { includeBaseline: false, offset: existing.length });
  return { steps: [...existing, ...steps], warnings };
}

export function countAttempted(steps = []) {
  return steps.filter((step) => step.attempted || step.outcome).length;
}

export function deriveStatus(session, steps) {
  const attempted = countAttempted(steps);
  if (steps.some((step) => step.outcome === 'worked')) return 'resolved';
  if (!attempted) return session?.verification_status === 'needs_more_information' ? 'needs_more_information' : 'in_progress';
  if (attempted >= steps.length) return 'unresolved';
  return 'partially_resolved';
}