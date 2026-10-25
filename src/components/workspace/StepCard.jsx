import { useState } from 'react';
import { Check, Copy, RefreshCw, ShieldAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RISK_META, STEP_OUTCOMES } from '@/lib/constants';

export default function StepCard({ step, onPatch, onAskAlternative }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(step.user_note || '');
  const risk = RISK_META[step.risk_level] || RISK_META.low;
  const outcome = STEP_OUTCOMES.find((item) => item.value === step.outcome);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(step.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className={`rounded-xl border bg-background/60 p-4 ${step.flagged ? 'border-inference/40' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-[11px] text-evidence">
          {step.order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{step.title}</p>
            <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${risk.classes}`}>{risk.label}</span>
            {outcome && <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${outcome.classes}`}>{outcome.label}</span>}
          </div>

          {step.instructions && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.instructions}</p>}

          {step.command && (
            <div className="mt-3 flex items-stretch gap-2">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-[12px] text-evidence">
                {step.command}
              </pre>
              <button
                type="button"
                onClick={copy}
                title="Copy this command"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-safe" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
          )}

          {step.expected_result && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground/80">Expected result:</span> {step.expected_result}
            </p>
          )}
          {step.why_it_helps && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground/80">Why:</span> {step.why_it_helps}
            </p>
          )}
          {step.flagged && step.flag_reason && (
            <p className="mt-2 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-foreground/90">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
              Flagged by the safety rules for {step.flag_reason}. Read the safety tab before running it, and never paste a command you do not
              understand.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={Boolean(step.attempted)} onCheckedChange={() => onPatch(step.id, { attempted: !step.attempted })} />
              attempted
            </label>
            {STEP_OUTCOMES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onPatch(step.id, { outcome: step.outcome === item.value ? '' : item.value, attempted: true })}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                  step.outcome === item.value ? item.classes : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
            {(step.outcome === 'did_not_work' || step.outcome === 'partially_worked') && (
              <button
                type="button"
                onClick={() => onAskAlternative(step)}
                className="inline-flex items-center gap-1.5 rounded-md border border-evidence/50 bg-evidence/10 px-2 py-1 font-mono text-[11px] text-evidence"
              >
                <RefreshCw className="h-3 w-3" /> ask for an alternative
              </button>
            )}
          </div>

          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => note !== (step.user_note || '') && onPatch(step.id, { user_note: note })}
            placeholder="What did you see when you ran this?"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-evidence focus:outline-none"
          />
        </div>
      </div>
    </li>
  );
}