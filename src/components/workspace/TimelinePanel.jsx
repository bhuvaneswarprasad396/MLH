import { Activity, Bot, Image as ImageIcon, User } from 'lucide-react';

const ICONS = { user: User, assistant: Bot, system: Activity, evidence: ImageIcon };

export default function TimelinePanel({ session }) {
  const messages = session.messages || [];

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-4">
      <h2 className="font-heading text-sm font-semibold tracking-tight">Troubleshooting timeline</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Everything that happened in this session, oldest first — kept for as long as the session is on this device.
      </p>

      <ol className="mt-4 space-y-3 border-l border-border pl-4">
        {messages.map((item) => {
          const Icon = ICONS[item.kind] || Bot;
          return (
            <li key={item.id} className="relative">
              <span className="absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
                <Icon className="h-2.5 w-2.5 text-muted-foreground" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {new Date(item.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} ·{' '}
                {item.kind}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{item.content}</p>
            </li>
          );
        })}
      </ol>

      {!messages.length && <p className="mt-3 text-sm text-muted-foreground">No events recorded yet.</p>}
    </section>
  );
}