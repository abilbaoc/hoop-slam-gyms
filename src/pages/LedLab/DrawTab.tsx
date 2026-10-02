import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, PaintBucket, Undo2, Trash2, Download, Type, Dribbble } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import LedMatrix, { type LedMatrixHandle, type PointerPhase } from './LedMatrix';
import {
  type Frame, COLOR_NAMES, GREEN, H, OFF, ORANGE, PALETTE, W,
  clear, createFrame, floodFill, frameFromBase64, frameToBase64, setPixel,
} from './matrix';
import { CHAR_SEGMENTS, drawSevenSeg, drawText } from './font';
import { DRAWING_KEY, loadItem, saveItem } from './storage';

type Tool = 'pen' | 'eraser' | 'fill';

const MAX_UNDO = 30;

/** Boot screen of the real hoop: "HOLA" on the 7-segment timer. */
function templateHola(frame: Frame): void {
  clear(frame);
  ['H', 'O', 'L', 'A'].forEach((ch, i) => {
    drawSevenSeg(frame, CHAR_SEGMENTS[ch], 5 + i * 14, 6, 11, 20, 2, GREEN);
  });
}

function templateHoop(frame: Frame): void {
  clear(frame);
  const cx = 15;
  const cy = 15;
  const r = 11;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) setPixel(frame, x, y, ORANGE);
    }
  }
  // Ball seams.
  for (let i = -r; i <= r; i++) {
    setPixel(frame, cx + i, cy, OFF);
    setPixel(frame, cx, cy + i, OFF);
  }
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    setPixel(frame, Math.round(cx - 7 + Math.cos(a) * 5), Math.round(cy + Math.sin(a) * 9), OFF);
    setPixel(frame, Math.round(cx + 7 + Math.cos(a) * 5), Math.round(cy + Math.sin(a) * 9), OFF);
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (Math.hypot(x - cx, y - cy) > r) setPixel(frame, x, y, OFF);
    }
  }
  drawText(frame, 'HOOP', 33, 8, GREEN);
  drawText(frame, 'SLAM', 33, 16, GREEN);
}

/** Bresenham line so fast strokes don't leave gaps between sampled cells. */
function line(frame: Frame, x0: number, y0: number, x1: number, y1: number, color: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(frame, x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export default function DrawTab() {
  const matrixRef = useRef<LedMatrixHandle>(null);
  const frameRef = useRef<Frame>(createFrame());
  const undoRef = useRef<Frame[]>([]);
  const lastCellRef = useRef<[number, number] | null>(null);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(GREEN);
  const [undoCount, setUndoCount] = useState(0);

  const redraw = useCallback(() => matrixRef.current?.draw(frameRef.current), []);

  const scheduleSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveItem(DRAWING_KEY, frameToBase64(frameRef.current));
    }, 400);
  }, []);

  useEffect(() => {
    const saved = loadItem(DRAWING_KEY);
    const restored = saved ? frameFromBase64(saved) : null;
    if (restored) frameRef.current = restored;
    else templateHola(frameRef.current);
    redraw();
    return () => {
      window.clearTimeout(saveTimerRef.current);
      saveItem(DRAWING_KEY, frameToBase64(frameRef.current));
    };
  }, [redraw]);

  const pushUndo = () => {
    undoRef.current.push(frameRef.current.slice());
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    setUndoCount(undoRef.current.length);
  };

  const onCell = (x: number, y: number, phase: PointerPhase) => {
    if (phase === 'up') {
      lastCellRef.current = null;
      scheduleSave();
      return;
    }
    const frame = frameRef.current;
    const paint = tool === 'eraser' ? OFF : color;
    if (phase === 'down') {
      pushUndo();
      if (tool === 'fill') {
        floodFill(frame, x, y, color);
      } else {
        setPixel(frame, x, y, paint);
        lastCellRef.current = [x, y];
      }
    } else if (tool !== 'fill') {
      const last = lastCellRef.current ?? [x, y];
      line(frame, last[0], last[1], x, y, paint);
      lastCellRef.current = [x, y];
    }
    redraw();
  };

  const applyTemplate = (fn: (f: Frame) => void) => {
    pushUndo();
    fn(frameRef.current);
    redraw();
    scheduleSave();
  };

  const undo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    frameRef.current = prev;
    setUndoCount(undoRef.current.length);
    redraw();
    scheduleSave();
  };

  const exportPng = async () => {
    const blob = await matrixRef.current?.toPngBlob(frameRef.current, 10);
    if (!blob) {
      toast.error('No se pudo generar la imagen');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hoop-led.png';
    a.click();
    // Revoking synchronously can cancel the download in Firefox/Safari.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('PNG exportado');
  };

  const toolBtn = (t: Tool, label: string, Icon: typeof Pencil) => (
    <Button
      variant={tool === t ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => setTool(t)}
      aria-pressed={tool === t}
    >
      <Icon size={14} /> {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      <LedMatrix ref={matrixRef} onCell={onCell} captureTouch ariaLabel="Panel LED para dibujar" />

      <div className="flex flex-wrap items-center gap-2">
        {toolBtn('pen', 'Lápiz', Pencil)}
        {toolBtn('eraser', 'Goma', Eraser)}
        {toolBtn('fill', 'Relleno', PaintBucket)}
        <span className="w-px h-6 bg-[#2C2C2E] mx-1" />
        <Button variant="secondary" size="sm" onClick={undo} disabled={undoCount === 0}>
          <Undo2 size={14} /> Deshacer
        </Button>
        <Button variant="secondary" size="sm" onClick={() => applyTemplate(clear)}>
          <Trash2 size={14} /> Limpiar
        </Button>
        <Button variant="secondary" size="sm" onClick={exportPng}>
          <Download size={14} /> Exportar PNG
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color">
        {PALETTE.slice(1).map((hex, i) => {
          const idx = i + 1;
          const selected = color === idx;
          return (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={COLOR_NAMES[idx]}
              title={COLOR_NAMES[idx]}
              onClick={() => { setColor(idx); if (tool === 'eraser') setTool('pen'); }}
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                background: hex,
                boxShadow: selected ? `0 0 0 2px #000, 0 0 0 4px ${hex}` : 'none',
                transform: selected ? 'scale(1.1)' : 'none',
              }}
            />
          );
        })}
        <span className="w-px h-6 bg-[#2C2C2E] mx-1" />
        <Button variant="ghost" size="sm" onClick={() => applyTemplate(templateHola)}>
          <Type size={14} /> HOLA
        </Button>
        <Button variant="ghost" size="sm" onClick={() => applyTemplate(templateHoop)}>
          <Dribbble size={14} /> Logo
        </Button>
      </div>

      <p className="text-xs text-[#636366]">
        Dibuja con el ratón o el dedo. El dibujo se guarda automáticamente en este navegador.
      </p>
    </div>
  );
}
