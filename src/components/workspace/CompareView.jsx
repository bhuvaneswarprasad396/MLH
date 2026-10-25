export default function CompareView({ session, viewUrls }) {
  const screenshots = session.screenshots || [];
  const before = screenshots[0];
  const after = screenshots[screenshots.length - 1];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { shot: before, caption: 'before · original problem' },
        { shot: after, caption: `after · ${after?.label || 'latest evidence'}` },
      ].map(({ shot, caption }) => (
        <figure key={caption} className="rounded-xl border border-border bg-background p-2">
          <div className="flex h-[240px] items-center justify-center overflow-hidden rounded-lg bg-secondary/40">
            {shot && viewUrls[shot.file_uri] ? (
              <img src={viewUrls[shot.file_uri]} alt={caption} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground">no image</span>
            )}
          </div>
          <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}