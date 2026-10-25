import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

const observed = [
  'Error: listen EADDRINUSE: address already in use :::3000',
  'at Server.setupListenHandle (node:net:1862:16)',
  'npm ERR! code ELIFECYCLE',
];

const inferred = [
  'Another process is already bound to port 3000 — most likely a previously running dev server that never exited.',
  'A second candidate: two terminals started the same npm script, so the first one still holds the port.',
];

const steps = [
  {
    n: 1,
    title: 'Find what is holding the port',
    command: 'lsof -i :3000',
    expected: 'One PID with the process name that owns the port.',
    risk: 'read-only',
  },
  {
    n: 2,
    title: 'Stop that process cleanly',
    command: 'kill <PID>',
    expected: 'The port is released and the next start succeeds.',
    risk: 'low',
  },
];

const languagePills = ['English', 'ગુજરાતી', 'తెలుగు'];

export default function SampleDiagnosisPreview() {
  return (
    <div id="sample-output" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">What you get back</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            A diagnosis that shows its evidence
          </h2>
        </div>
        <span className="rounded-full border border-inference/40 bg-inference/10 px-3 py-1 font-mono text-[11px] text-inference">
          sample output · demo data
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground">
            terminal · runtime error
          </span>
          <span className="font-heading text-sm font-semibold">Port 3000 is already in use</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-inference/40 bg-inference/10 px-3 py-1 font-mono text-[11px] text-inference">
            <AlertTriangle className="h-3 w-3" /> confidence: medium
          </span>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-2">
          <div className="bg-card px-4 py-5 sm:px-5">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-evidence">
              <Info className="h-3.5 w-3.5" /> observed — read from the pixels
            </p>
            <ul className="mt-3 space-y-2">
              {observed.map((line) => (
                <li key={line} className="font-mono text-[12px] leading-relaxed text-foreground/90">
                  <span className="mr-2 text-evidence">›</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card px-4 py-5 sm:px-5">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-inference">
              <Info className="h-3.5 w-3.5" /> inferred — hypothesis, not fact
            </p>
            <ul className="mt-3 space-y-3">
              {inferred.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-muted-foreground">
                  <span className="mr-2 text-inference">?</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border px-4 py-5 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.n} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary font-mono text-[11px] text-evidence">
                    {step.n}
                  </span>
                  <p className="text-sm font-medium">{step.title}</p>
                  <span className="ml-auto rounded border border-safe/40 bg-safe/10 px-2 py-0.5 font-mono text-[10px] text-safe">
                    risk: {step.risk}
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-[12px] text-evidence">
                  {step.command}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground/80">Expected:</span> {step.expected}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 sm:flex-row sm:items-center">
            <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-foreground/90">
              <span className="font-medium">Safety warning:</span> never run <code className="font-mono text-danger">kill -9</code> on a
              PID you have not identified — it can drop unsaved work. Nothing from this app is ever executed on your machine.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">voice walkthrough</span>
            {languagePills.map((label) => (
              <span key={label} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground/90">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}