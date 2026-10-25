import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import { CATEGORY_LABELS, CONFIDENCE_META, STATUS_META } from '@/lib/constants';
import { forgetSession, listSessions } from '@/lib/sessionStore';

export default function History() {
  const [sessions, setSessions] = useState(listSessions());
  const [confirmId, setConfirmId] = useState('');

  const remove = (id) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    forgetSession(id);
    setSessions(listSessions());
    setConfirmId('');
    toast.success('Session removed from this device.');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        action={
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-evidence px-3 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New analysis</span>
          </Link>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">session history</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Every problem you have worked through</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sessions are stored in this browser only, so nothing about your screenshots is retained on a server between visits.
        </p>

        {sessions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
            <p className="font-heading text-lg font-semibold tracking-tight">No sessions yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Upload a screenshot of something broken and the diagnosis will be saved here for you to continue later.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-evidence px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Analyse a screenshot
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {sessions.map((item) => {
              const status = STATUS_META[item.verification_status] || STATUS_META.in_progress;
              const confidence = CONFIDENCE_META[item.confidence_level] || CONFIDENCE_META.low;
              return (
                <li key={item.id} className="rounded-2xl border border-border bg-card/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link to={`/session/${item.id}`} className="min-w-0 flex-1">
                      <p className="font-heading text-base font-semibold tracking-tight">{item.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                        <span className={`rounded-full border px-2 py-0.5 ${status.classes}`}>{status.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 ${confidence.classes}`}>{item.confidence_level || 'low'}</span>
                        <span>{CATEGORY_LABELS[item.problem_type] || 'Uncategorised'}</span>
                        <span>
                          {item.screenshot_count} screenshot{item.screenshot_count === 1 ? '' : 's'}
                        </span>
                        <span>updated {new Date(item.updated_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
                        confirmId === item.id ? 'border-danger/50 bg-danger/10 text-danger' : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {confirmId === item.id ? 'confirm' : 'delete'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}