const RANK = { read_only: 0, low: 1, medium: 2, high: 3 };
const LEVELS = ['read_only', 'low', 'medium', 'high'];

/** Rules that decide whether a suggested command is safe, and how to label it. */
const COMMAND_RULES = [
  { pattern: /\brm\s+(-[a-z]*\s+)*(-[a-z]*[rf][a-z]*|--recursive|--force)/i, level: 'high', flag: 'recursive or forced file deletion' },
  { pattern: /\bsudo\s+rm\b|\bsudo\s+rmdir\b/i, level: 'high', flag: 'deleting files with elevated privileges' },
  { pattern: /\bmkfs(\.\w+)?\b|\bformat\s+[a-z]:/i, level: 'high', flag: 'formatting a disk or volume' },
  { pattern: /\bdd\s+if=|\bdd\s+of=\/dev\//i, level: 'high', flag: 'raw block-level disk write' },
  { pattern: /\bdiskpart\b|\bdiskutil\s+(erase|reformat)|\bclean\s+all\b/i, level: 'high', flag: 'erasing a disk' },
  { pattern: /drop\s+(table|database)|\btruncate\s+table\b/i, level: 'high', flag: 'destroying database objects' },
  { pattern: /\bdelete\s+from\b/i, level: 'high', flag: 'deleting database rows' },
  { pattern: /\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[a-z]*[fd]/i, level: 'high', flag: 'discarding uncommitted work' },
  { pattern: /\bgit\s+push\b[^\n]*(--force|-f)\b/i, level: 'high', flag: 'rewriting shared git history' },
  { pattern: /chmod\s+(-[a-zA-Z]+\s+)*777|\bicacls\b[^\n]*\/grant/i, level: 'high', flag: 'opening file permissions to every user' },
  { pattern: /chown\s+-R\s+[^\n]*\s\/(\s|$)/i, level: 'high', flag: 'recursively changing ownership of system paths' },
  { pattern: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|po)?sh\b/i, level: 'high', flag: 'piping a remote script straight into a shell' },
  { pattern: /setenforce\s+0|selinux[^\n]*permissive|disable[ds]?\s+(firewall|defender|gatekeeper|antivirus|sip|selinux)/i, level: 'high', flag: 'turning off a security control' },
  { pattern: /\b(net\s+user|useradd|adduser|new-localuser)\b/i, level: 'high', flag: 'creating or modifying user accounts' },
  { pattern: /\b(reg\s+delete|takeown|runas)\b/i, level: 'high', flag: 'changing Windows ownership or registry keys' },
  { pattern: /(\.ssh\/|\.ssh\\|id_rsa|id_ed25519|\.aws\/credentials|\.npmrc|\.netrc|git-credentials)/i, level: 'high', flag: 'reading or changing credential files' },
  { pattern: /\b(cat|type|more|less|echo)\b[^\n]*(token|secret|password|api[_-]?key|credential)/i, level: 'high', flag: 'printing a secret to the terminal' },
  { pattern: /\b(env|printenv|set)\s*\|\s*(grep|sort|findstr)/i, level: 'medium', flag: 'dumping environment variables, which often hold secrets' },
  { pattern: /kill\s+-9\b|taskkill\b[^\n]*\/f/i, level: 'medium', flag: 'force-killing a process without letting it exit cleanly' },
  { pattern: /(\bnpm\b|\byarn\b|\bpnpm\b)[^\n]*\s(-g|--global)\b|pip\s+install[^\n]*--break-system-packages/i, level: 'medium', flag: 'changing the machine-wide environment' },
  { pattern: /\b(apt|apt-get|brew|choco|winget)\b[^\n]*(install|upgrade)|npm\s+install[^\n]*-f\b/i, level: 'medium', flag: 'installing or upgrading system packages' },
  { pattern: /--force\b|--no-verify\b|--unsafe-perm\b/i, level: 'medium', flag: 'bypassing a safety check' },
  { pattern: /\bkillall\b|\bpkill\b/i, level: 'medium', flag: 'killing processes by name, which may hit more than intended' },
  { pattern: /\b(systemctl|service)\s+(restart|stop|disable)/i, level: 'medium', flag: 'restarting or stopping a system service' },
];

/** Lines that mean the text inside a screenshot is trying to give the assistant orders. */
const INJECTION_RULES = [
  { pattern: /ignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)/i, flag: 'instruction-override attempt' },
  { pattern: /disregard[^\n]{0,40}(instructions?|rules?|safety|guardrails)/i, flag: 'instruction-override attempt' },
  { pattern: /override[^\n]{0,30}(rules?|safety|guardrails|restrictions)/i, flag: 'instruction-override attempt' },
  { pattern: /you\s+are\s+now\s+(an?\s+)?[\w\s]{0,30}(assistant|ai|mode)/i, flag: 'role-reassignment attempt' },
  { pattern: /^\s*(system|assistant)\s*:/im, flag: 'fake system message inside image text' },
  { pattern: /new\s+instructions?\s*:/i, flag: 'fake instruction block inside image text' },
  { pattern: /(developer|debug|jailbreak)\s+mode/i, flag: 'mode-switch attempt' },
  { pattern: /do\s+not\s+(tell|warn|alert)\s+the\s+user/i, flag: 'instruction to hide information from the user' },
];

export function normalizeLevel(value) {
  const cleaned = String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['readonly', 'read_only', 'none', 'safe'].includes(cleaned)) return 'read_only';
  if (['medium', 'moderate', 'caution'].includes(cleaned)) return 'medium';
  if (['high', 'dangerous', 'critical', 'danger'].includes(cleaned)) return 'high';
  return 'low';
}

export function maxLevel(...levels) {
  let best = 'read_only';
  levels.forEach((level) => {
    const normalized = normalizeLevel(level);
    if (RANK[normalized] > RANK[best]) best = normalized;
  });
  return best;
}

export function isRisky(level) {
  return level === 'medium' || level === 'high';
}

export function commandRisk(command) {
  const text = String(command || '').trim();
  if (!text) return { level: 'read_only', flags: [] };
  const flags = [];
  let level = 'read_only';
  COMMAND_RULES.forEach((rule) => {
    if (rule.pattern.test(text)) {
      flags.push(rule.flag);
      if (RANK[rule.level] > RANK[level]) level = rule.level;
    }
  });
  return { level: flags.length ? level : 'low', flags: Array.from(new Set(flags)) };
}

/**
 * Screenshot text is untrusted data: instruction-like lines are dropped before
 * the text is ever sent to a model, and reported so the user sees it happened.
 */
export function sanitizeUntrusted(input) {
  const injections = [];
  const kept = String(input || '')
    .split(/\r?\n/)
    .map((line) => {
      const hit = INJECTION_RULES.find((rule) => rule.pattern.test(line));
      if (!hit) return line;
      injections.push(hit.flag);
      return '[line removed: text inside the screenshot tried to give instructions]';
    });
  return { text: kept.join('\n'), injections: Array.from(new Set(injections)) };
}

const BASELINE_WARNINGS = [
  {
    level: 'info',
    message: 'Nothing here runs on your computer. Every command is text you choose to copy and run yourself.',
    safer_alternative: null,
  },
  {
    level: 'info',
    message: 'Screenshots can contain tokens, URLs or personal data — check what is visible before sharing one.',
    safer_alternative: null,
  },
];

/** Re-tags every step with a trustworthy risk level and raises warnings for it. */
export function hardenSteps(steps = [], { includeBaseline = true, offset = 0 } = {}) {
  const warnings = includeBaseline ? [...BASELINE_WARNINGS] : [];
  const hardened = steps.map((step, index) => {
    const scan = commandRisk(step?.command);
    const finalLevel = maxLevel(step?.risk_level, scan.level);
    if (scan.flags.length) {
      warnings.push({
        level: finalLevel === 'high' ? 'danger' : 'caution',
        message: `Step ${step?.order ?? ''} “${step?.title || 'Untitled step'}” involves ${scan.flags.join('; ')}.`,
        safer_alternative:
          finalLevel === 'high'
            ? 'Run the read-only diagnostic first and confirm exactly what you are about to change before running this.'
            : 'Prefer the inspecting command first; only change state once you know what is there.',
        step_id: step?.id,
      });
    }
    return {
      ...step,
      id: step?.id || `step-${offset + index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      order: offset + index + 1,
      risk_level: finalLevel,
      flagged: scan.flags.length > 0 || isRisky(finalLevel),
      flag_reason: scan.flags.join('; '),
      attempted: Boolean(step?.attempted),
      outcome: step?.outcome || '',
      user_note: step?.user_note || '',
    };
  });
  return { steps: hardened, warnings };
}

export function normalizeWarnings(raw = []) {
  return (Array.isArray(raw) ? raw : [])
    .map((warning) => ({
      level: ['danger', 'caution', 'info'].includes(String(warning?.level || '').toLowerCase())
        ? String(warning.level).toLowerCase()
        : 'caution',
      message: String(warning?.message || '').trim(),
      safer_alternative: warning?.safer_alternative ? String(warning.safer_alternative) : null,
      step_id: warning?.step_id || undefined,
    }))
    .filter((warning) => warning.message.length > 0);
}

export function dedupeWarnings(warnings = []) {
  const seen = new Set();
  return (Array.isArray(warnings) ? warnings : []).filter((warning) => {
    const key = String(warning?.message || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}