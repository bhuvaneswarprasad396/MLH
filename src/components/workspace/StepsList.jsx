import StepCard from '@/components/workspace/StepCard';

export default function StepsList({ session, onPatch, onAskAlternative }) {
  const steps = session.recommended_steps || [];

  if (!steps.length) {
    return (
      <p className="rounded-lg border border-border bg-background/60 px-3 py-4 text-sm text-muted-foreground">
        No safe steps could be derived yet. Answer the question in the chat and the next steps will appear here.
      </p>
    );
  }

  const attempted = session.attempted_count || 0;

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>numbered solution steps · newest evidence first</span>
        <span>
          {attempted} / {steps.length} reported
        </span>
      </div>
      <ol className="mt-3 space-y-3">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} onPatch={onPatch} onAskAlternative={onAskAlternative} />
        ))}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Nothing on this page runs automatically. Copy a command only after you have read it, and report what happened so the diagnosis can
        update.
      </p>
    </div>
  );
}