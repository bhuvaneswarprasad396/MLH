export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', locale: 'en-IN' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', locale: 'gu-IN' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', locale: 'te-IN' },
];

export const STATUS_META = {
  needs_more_information: {
    label: 'Needs more information',
    classes: 'border-inference/40 bg-inference/10 text-inference',
    dot: 'bg-inference',
  },
  in_progress: {
    label: 'Diagnosis ready',
    classes: 'border-evidence/40 bg-evidence/10 text-evidence',
    dot: 'bg-evidence',
  },
  partially_resolved: {
    label: 'Partially resolved',
    classes: 'border-inference/40 bg-inference/10 text-inference',
    dot: 'bg-inference',
  },
  resolved: {
    label: 'Resolved',
    classes: 'border-safe/40 bg-safe/10 text-safe',
    dot: 'bg-safe',
  },
  unresolved: {
    label: 'Still unresolved',
    classes: 'border-danger/40 bg-danger/10 text-danger',
    dot: 'bg-danger',
  },
};

export const RISK_META = {
  read_only: { label: 'read-only', classes: 'border-safe/40 bg-safe/10 text-safe' },
  low: { label: 'low risk', classes: 'border-safe/40 bg-safe/10 text-safe' },
  medium: { label: 'medium risk', classes: 'border-inference/40 bg-inference/10 text-inference' },
  high: { label: 'high risk', classes: 'border-danger/40 bg-danger/10 text-danger' },
};

export const CATEGORY_LABELS = {
  ide_compiler: 'IDE & compiler',
  terminal_cli: 'Terminal & CLI',
  browser_web: 'Browser & web',
  git_version_control: 'Git & version control',
  package_manager: 'Packages & dependencies',
  database: 'Database',
  install_config: 'Install & configuration',
  os_dialog: 'Operating system',
  network: 'Network',
  hardware: 'Hardware',
  security: 'Security',
  other: 'Uncategorised',
};

export const STEP_OUTCOMES = [
  { value: 'worked', label: 'Worked', classes: 'border-safe/50 bg-safe/15 text-safe' },
  { value: 'partially_worked', label: 'Partly worked', classes: 'border-inference/50 bg-inference/15 text-inference' },
  { value: 'did_not_work', label: 'Did not work', classes: 'border-danger/50 bg-danger/15 text-danger' },
  { value: 'skipped', label: 'Skipped', classes: 'border-border bg-secondary text-muted-foreground' },
];

export const CONFIDENCE_META = {
  high: { label: 'high confidence', classes: 'border-safe/40 bg-safe/10 text-safe' },
  medium: { label: 'medium confidence', classes: 'border-inference/40 bg-inference/10 text-inference' },
  low: { label: 'low confidence', classes: 'border-danger/40 bg-danger/10 text-danger' },
};

export const STRENGTH_META = {
  strong: { label: 'strong', classes: 'border-safe/40 bg-safe/10 text-safe' },
  plausible: { label: 'plausible', classes: 'border-inference/40 bg-inference/10 text-inference' },
  speculative: { label: 'speculative', classes: 'border-danger/40 bg-danger/10 text-danger' },
};

export const PROBLEM_TYPE_FALLBACK = 'other';