import { ScanEye } from 'lucide-react';

export default function HighlightList({ highlights = [], ocrAvailable, showHighlights, onToggleHighlights }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
          <ScanEye className="h-4 w-4 text-evidence" /> Text matched on screen
        </h2>
        <button
          type="button"
          onClick={onToggleHighlights}
          className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {showHighlights ? 'hide overlay' : 'show overlay'}
        </button>
      </div>

      {!ocrAvailable ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Text detection did not run for this session, so the diagnosis is shown without highlights.
        </p>
      ) : highlights.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No reliable match was found between the detected text and the diagnosis, so no highlight is drawn. The diagnosis below stands on its
          own.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {highlights.map((highlight) => (
            <li key={highlight.id} className="rounded-lg border border-border bg-background/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${highlight.kind === 'evidence' ? 'bg-evidence' : 'bg-inference'}`} />
                <code className="truncate font-mono text-[12px] text-foreground/90">{highlight.label}</code>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {highlight.kind === 'evidence' ? 'exact match' : 'related'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{highlight.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}