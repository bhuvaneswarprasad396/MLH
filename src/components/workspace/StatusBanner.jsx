import { Activity, Camera, Cpu, ShieldAlert } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_META } from '@/lib/constants';

export default function StatusBanner({ session }) {
  const meta = STATUS_META[session.verification_status] || STATUS_META.in_progress;
  const steps = session.recommended_steps || [];
  const attempted = session.attempted_count || 0;
  const percent = steps.length ? Math.round((attempted / steps.length) * 100) : 0;
  const screenshots = (session.screenshots || []).length;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">session diagnosis</p>
          <h1 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{session.short_title}</h1>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] ${meta.classes}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1">
          <Cpu className="h-3 w-3" /> {session.engine || 'app vision model'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1">
          <Activity className="h-3 w-3" /> {CATEGORY_LABELS[session.problem_type] || 'Uncategorised'}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1">
          <Camera className="h-3 w-3" /> {screenshots} screenshot{screenshots === 1 ? '' : 's'}
        </span>
        <span className="rounded-md border border-border bg-secondary px-2 py-1">
          analysed {session.analysis_count || 1}×
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>verification progress</span>
          <span>
            {attempted} / {steps.length} steps reported
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-evidence transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {session.injection_detected && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-inference/40 bg-inference/10 px-3 py-2 text-xs leading-relaxed text-inference">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This screenshot contained text written to look like instructions to the assistant. It was stripped before analysis and treated as
          evidence only — never as a command.
        </p>
      )}
    </div>
  );
}