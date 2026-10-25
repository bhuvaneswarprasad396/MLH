import { useEffect, useRef, useState } from 'react';
import { Crop, ImagePlus, Loader2, ScanSearch, Trash2, Upload } from 'lucide-react';
import CropOverlay from '@/components/CropOverlay';
import { cropToFile, formatBytes, validateImage } from '@/lib/imageUtils';

export default function UploadDropzone({ file, onFileChange, onAnalyze, busy = false, busyLabel = 'Analyzing screenshot…' }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [cropping, setCropping] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [natural, setNatural] = useState(null);
  const inputRef = useRef(null);
  const imageBoxRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      setNatural(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const onPaste = (event) => {
      const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'));
      if (item) accept(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const accept = (candidate) => {
    const message = validateImage(candidate);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setCropping(false);
    onFileChange(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  const applyCrop = async (rect) => {
    try {
      const cropped = await cropToFile(file, rect);
      setCropping(false);
      setNatural(null);
      onFileChange(cropped);
      setError('');
    } catch (cropError) {
      setError(cropError.message);
      setCropping(false);
    }
  };

  if (!file) {
    return (
      <div>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === 'Enter' && inputRef.current?.click()}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
            dragging ? 'border-evidence bg-evidence/5' : 'border-border bg-card/50 hover:border-evidence/60 hover:bg-card'
          }`}
        >
          <div className="hero-glow pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 opacity-70" />
          <div className="relative">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-secondary text-evidence">
              <ImagePlus className="h-6 w-6" />
            </span>
            <p className="mt-5 font-heading text-lg font-semibold tracking-tight">
              Drop a screenshot of the error
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Or click to browse, or paste straight from your clipboard with <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px]">Ctrl</kbd>{' '}
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px]">V</kbd>
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              png · jpg · webp · gif · bmp — up to 8 MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => accept(event.target.files?.[0])}
          />
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-background" ref={imageBoxRef}>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Uploaded screenshot preview"
            className="max-h-[320px] w-full object-contain"
            onLoad={(event) =>
              setNatural({ width: event.target.naturalWidth, height: event.target.naturalHeight })
            }
          />
        )}
        {cropping && (
          <CropOverlay boxRef={imageBoxRef} natural={natural} onApply={applyCrop} onCancel={() => setCropping(false)} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 font-mono text-[11px] text-muted-foreground">
          <span className="block truncate text-foreground">{file.name}</span>
          <span>
            {formatBytes(file.size)}
            {natural ? ` · ${natural.width}×${natural.height} px` : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCropping((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Crop className="h-3.5 w-3.5" /> {cropping ? 'stop crop' : 'crop'}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" /> replace
          </button>
          <button
            type="button"
            onClick={() => {
              setCropping(false);
              setError('');
              onFileChange(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> remove
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => accept(event.target.files?.[0])}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAnalyze?.(file)}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-evidence px-4 py-3 font-heading text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
        {busy ? busyLabel : 'Analyze screenshot'}
      </button>

      {error && (
        <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}