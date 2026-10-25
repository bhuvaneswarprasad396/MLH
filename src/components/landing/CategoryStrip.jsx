const categories = [
  { label: 'IDE & compiler errors', hint: 'TypeScript, Java, C++, Rust' },
  { label: 'Terminal & CLI failures', hint: 'shell, permissions, PATH' },
  { label: 'Browser & website errors', hint: 'CORS, 4xx/5xx, TLS' },
  { label: 'Git & version control', hint: 'merge, detached HEAD' },
  { label: 'npm · pip · dependencies', hint: 'peer deps, lockfiles' },
  { label: 'Database connections', hint: 'auth, host, SSL' },
  { label: 'Install & configuration', hint: 'installs, config files' },
  { label: 'OS & app error dialogs', hint: 'drivers, updates' },
  { label: 'Anything else visible', hint: 'asks when unsure' },
];

export default function CategoryStrip() {
  return (
    <section className="border-y border-border/70 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Universally applicable</p>
        <h2 className="mt-2 max-w-2xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Not a VS Code plugin. Any screen that shows something broken.
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.label}
              className="group rounded-xl border border-border bg-card/60 px-4 py-3 transition-colors hover:border-evidence/50 hover:bg-card"
            >
              <p className="text-sm font-medium">{category.label}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{category.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}