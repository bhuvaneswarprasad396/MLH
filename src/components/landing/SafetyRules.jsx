import { Ban, Eye, Lock, ShieldCheck } from 'lucide-react';

const rules = [
  {
    icon: Ban,
    title: 'Nothing is ever executed',
    body: 'Every command is text you copy yourself. The app has no access to your machine, your shell or your files.',
  },
  {
    icon: ShieldCheck,
    title: 'Read-only steps come first',
    body: 'Diagnostics that only inspect the system are preferred, and risky commands are labelled with their risk level.',
  },
  {
    icon: Eye,
    title: 'Screenshots are data, not orders',
    body: 'Text inside an image that tries to override the assistant’s rules is treated as untrusted evidence and ignored.',
  },
  {
    icon: Lock,
    title: 'Your key stays on the server',
    body: 'The model is called from the backend. No API key is ever shipped to the browser or written into the page.',
  },
];

export default function SafetyRules() {
  return (
    <section id="safety" className="scroll-mt-24 border-y border-border/70 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Safety first</p>
        <h2 className="mt-2 max-w-2xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Advice you should be allowed to read before you run it
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => (
            <div key={rule.title} className="flex gap-4 rounded-2xl border border-border bg-card/50 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-safe/40 bg-safe/10 text-safe">
                <rule.icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold tracking-tight">{rule.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{rule.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}