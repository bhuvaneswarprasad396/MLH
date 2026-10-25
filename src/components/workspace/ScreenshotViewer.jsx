import { useState } from 'react';
import { ImageOff, Layers, ScanEye, ZoomIn, ZoomOut } from 'lucide-react';
import { Image } from '@/components/ui/image';
import CompareView from '@/components/workspace/CompareView';

const LABELS = { original: 'original', before: 'before', after: 'after' };

export default function ScreenshotViewer({
  session,
  viewUrls,
  highlights = [],
  showHighlights,
  onToggleHighlights,
  activeIndex,
  onActiveIndex,
  selectedHighlightId,
}) {
  const [zoom, setZoom] = useState(1);
  const [compare, setCompare] = useState(false);
  const screenshots = session.screenshots || [];
  const active = screenshots[activeIndex] || screenshots[0];
  const url = active ? viewUrls[active.file_uri] : '';
  const ratio = active?.width && active?.height ? `${active.width} / ${active.height}` : '16 / 9';

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {screenshots.map((shot, index) => (
            <button
              key={shot.file_uri}
              type="button"
              onClick={() => {
                setCompare(false);
                onActiveIndex(index);
              }}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                index === activeIndex && !compare
                  ? 'border-evidence/50 bg-evidence/10 text-evidence'
                  : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {LABELS[shot.label] || shot.label} {screenshots.length > 1 ? `· ${index + 1}` : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleHighlights}
            title="Toggle OCR highlights"
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
              showHighlights ? 'border-evidence/50 bg-evidence/10 text-evidence' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ScanEye className="h-3.5 w-3.5" /> highlights
          </button>
          {screenshots.length > 1 && (
            <button
              type="button"
              onClick={() => setCompare((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                compare ? 'border-evidence/50 bg-evidence/10 text-evidence' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> compare
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))}
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))}
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {compare && screenshots.length > 1 ? (
        <div className="mt-3">
          <CompareView session={session} viewUrls={viewUrls} />
        </div>
      ) : (
        <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-border bg-background p-2">
          {url ? (
            <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, aspectRatio: ratio }}>
              <Image
                src={url}
                alt={`${LABELS[active?.label] || 'screenshot'} of the reported problem`}
                fittingType="fill"
                className="absolute inset-0 h-full w-full rounded-lg"
              />
              {showHighlights &&
                highlights.map((highlight, index) => (
                  <div
                    key={highlight.id}
                    title={highlight.explanation}
                    className={`absolute rounded border-2 transition-all ${highlight.id === selectedHighlightId ? 'z-20 scale-[1.03] border-white bg-evidence/35 shadow-[0_0_0_3px_hsl(var(--evidence)/.35)]' : ''} ${
                      highlight.kind === 'evidence' ? 'border-evidence bg-evidence/20' : 'border-inference bg-inference/20'
                    }`}
                    style={{
                      left: `${highlight.left}%`,
                      top: `${highlight.top}%`,
                      width: `${highlight.width}%`,
                      height: `${highlight.height}%`,
                    }}
                  >
                    {index === 0 && (
                      <span className="absolute -top-5 left-0 rounded bg-evidence px-1 font-mono text-[10px] text-primary-foreground">
                        {highlight.label.slice(0, 24)}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="h-4 w-4" /> This screenshot could not be reopened.
            </div>
          )}
        </div>
      )}

      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        {active?.width && active?.height ? `${active.width}×${active.height} px · ` : ''}
        {active?.note ? `${active.note} · ` : ''}
        {LABELS[active?.label] || 'screenshot'} stored locally in this browser
      </p>
    </div>
  );
}