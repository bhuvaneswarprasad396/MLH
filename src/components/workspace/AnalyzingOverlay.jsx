import { Loader2 } from 'lucide-react';

export default function AnalyzingOverlay({ stage }) {
  const progress = typeof stage?.progress === 'number' ? stage.progress : null;
  return (
    <div className="relative overflow-hidden rounded-xl border border-evidence/40 bg-card/80 p-4">
      <div className="scanline pointer-events-none absolute inset-0" />
      <div className="relative flex items-center gap-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-evidence" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-evidence">{stage?.stage || 'working'}</p>
          <p className="mt-1 truncate text-sm">{stage?.label || 'Working…'}</p>
        </div>
        {progress !== null && <span className="font-mono text-[11px] text-muted-foreground">{progress}%</span>}
      </div>
      {progress !== null && (
        <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-evidence transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}