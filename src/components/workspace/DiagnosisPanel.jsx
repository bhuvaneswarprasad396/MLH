import { CheckCircle2, HelpCircle, Info, Target } from 'lucide-react';
import { CONFIDENCE_META, STRENGTH_META } from '@/lib/constants';

export default function DiagnosisPanel({ session }) {
  const confidence = CONFIDENCE_META[session.confidence_level] || CONFIDENCE_META.low;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-evidence">
          <Info className="h-3.5 w-3.5" /> observed — read from the pixels
        </h3>
        {session.observed_error ? (
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground/90">
            {session.observed_error}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No exact error string was readable in this screenshot.</p>
        )}
        {!!(session.evidence_observed || []).length && (
          <ul className="mt-2 space-y-1.5">
            {session.evidence_observed.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-evidence" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-inference">
          <Target className="h-3.5 w-3.5" /> inferred — a hypothesis, not a fact
        </h3>
        {!!(session.likely_causes || []).length ? (
          <ul className="mt-2 space-y-2">
            {session.likely_causes.map((cause, index) => {
              const strength = STRENGTH_META[cause.evidence_strength] || STRENGTH_META.plausible;
              return (
                <li key={`${cause.cause}-${index}`} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{cause.cause}</p>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${strength.classes}`}>{strength.label}</span>
                  </div>
                  {cause.reasoning && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{cause.reasoning}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No cause could be inferred from this screenshot alone.</p>
        )}
      </section>

      <section>
        <p className="text-sm leading-relaxed text-foreground/90">{session.plain_language_explanation}</p>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] ${confidence.classes}`}>
          {confidence.label}
        </div>
        {session.confidence_reason && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{session.confidence_reason}</p>}
      </section>

      {(!!(session.missing_information || []).length || session.clarifying_question) && (
        <section className="rounded-xl border border-inference/40 bg-inference/10 p-4">
          <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-inference">
            <HelpCircle className="h-3.5 w-3.5" /> what would sharpen this
          </h3>
          {!!(session.missing_information || []).length && (
            <ul className="mt-2 space-y-1.5">
              {session.missing_information.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-inference" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {session.clarifying_question && (
            <p className="mt-3 rounded-lg border border-inference/30 bg-background/60 px-3 py-2 text-sm">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-inference">asking you: </span>
              {session.clarifying_question}
            </p>
          )}
        </section>
      )}

      {session.verification_instructions && (
        <section>
          <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-safe">
            <CheckCircle2 className="h-3.5 w-3.5" /> how you confirm it is fixed
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{session.verification_instructions}</p>
        </section>
      )}
    </div>
  );
}