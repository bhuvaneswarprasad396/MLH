const phases = [
  {
    step: '01',
    title: 'Read the screenshot',
    body: 'On-device OCR reads visible text and coordinates. Typed or spoken context makes local troubleshooting more specific.',
  },
  {
    step: '02',
    title: 'Separate evidence from theory',
    body: 'The diagnosis lists what is literally visible in the image, then the causes it is inferring on top of that.',
  },
  {
    step: '03',
    title: 'Walk the fix, safely',
    body: 'Numbered steps with expected results and risk levels. Risky or destructive commands are flagged before you touch them.',
  },
  {
    step: '04',
    title: 'Check with new evidence',
    body: 'Mark steps attempted, report what happened, upload the next screenshot — the session keeps the whole trail.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">The loop</p>
        <h2 className="mt-2 max-w-2xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Upload → diagnose → fix → verify
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {phases.map((phase) => (
            <div key={phase.step} className="relative rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-evidence">{phase.step}</span>
              <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight">{phase.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}