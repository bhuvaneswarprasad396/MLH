import { useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

/** Draggable crop selection drawn on top of a displayed image. */
export default function CropOverlay({ boxRef, natural, onApply, onCancel }) {
  const [rect, setRect] = useState(null);
  const drag = useRef(null);

  const pointer = (event) => {
    const box = boxRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(event.clientX - box.left, 0), box.width),
      y: Math.min(Math.max(event.clientY - box.top, 0), box.height),
      box,
    };
  };

  const handleDown = (event) => {
    event.preventDefault();
    const { x, y, box } = pointer(event);
    const inside = rect && x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height;
    drag.current = inside
      ? { mode: 'move', startX: x, startY: y, origin: { ...rect }, box }
      : { mode: 'draw', startX: x, startY: y, box };
    if (!inside) setRect({ x, y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMove = (event) => {
    if (!drag.current) return;
    const { x, y } = pointer(event);
    const { mode, startX, startY, box } = drag.current;
    if (mode === 'draw') {
      setRect({
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY),
      });
      return;
    }
    const origin = drag.current.origin;
    const nextX = Math.min(Math.max(origin.x + (x - startX), 0), box.width - origin.width);
    const nextY = Math.min(Math.max(origin.y + (y - startY), 0), box.height - origin.height);
    setRect({ ...origin, x: nextX, y: nextY });
  };

  const handleUp = () => {
    drag.current = null;
    if (rect && (rect.width < 16 || rect.height < 16)) setRect(null);
  };

  const apply = () => {
    if (!rect || !natural || !boxRef.current) return;
    const scale = natural.width / boxRef.current.clientWidth;
    onApply({
      x: rect.x * scale,
      y: rect.y * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    });
  };

  return (
    <div
      className="absolute inset-0 cursor-crosshair select-none"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
    >
      {rect && rect.width > 4 && (
        <div
          className="absolute border-2 border-evidence"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px hsl(220 24% 5% / 0.68)',
          }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-background/85 px-3 py-2 backdrop-blur">
        <p className="font-mono text-[11px] text-muted-foreground">
          {rect && rect.width > 4
            ? `selection ${Math.round(rect.width)}×${Math.round(rect.height)} px`
            : 'drag over the image to select the area worth diagnosing'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" /> cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!rect || rect.width < 16}
            className="inline-flex items-center gap-1.5 rounded-md bg-evidence px-2.5 py-1.5 font-mono text-[11px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Check className="h-3 w-3" /> apply crop
          </button>
        </div>
      </div>
    </div>
  );
}