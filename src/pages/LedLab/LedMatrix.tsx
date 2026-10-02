import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { type Frame, H, PALETTE, W } from './matrix';

export interface LedMatrixHandle {
  draw: (frame: Frame) => void;
  /** Renders the frame as a crisp PNG (one square block per LED). */
  toPngBlob: (frame: Frame, scale: number) => Promise<Blob | null>;
}

export type PointerPhase = 'down' | 'move' | 'up';

interface LedMatrixProps {
  ref?: Ref<LedMatrixHandle>;
  /** Called with the LED cell under the pointer (mouse or touch). */
  onCell?: (x: number, y: number, phase: PointerPhase) => void;
  /** Disables browser scroll/zoom gestures over the panel (needed for drawing). */
  captureTouch?: boolean;
  ariaLabel?: string;
}

const OFF_DOT = '#1C1C1C';

/** Pre-renders one glowing LED per palette colour at the current cell size. */
function buildDotSprites(cell: number): HTMLCanvasElement[] {
  return PALETTE.map((color, idx) => {
    const c = document.createElement('canvas');
    c.width = cell;
    c.height = cell;
    const g = c.getContext('2d')!;
    const r = cell * 0.36;
    const cx = cell / 2;
    if (idx === 0) {
      g.fillStyle = OFF_DOT;
      g.beginPath();
      g.arc(cx, cx, r * 0.85, 0, Math.PI * 2);
      g.fill();
      return c;
    }
    const halo = g.createRadialGradient(cx, cx, r * 0.4, cx, cx, cell * 0.5);
    halo.addColorStop(0, `${color}66`);
    halo.addColorStop(1, `${color}00`);
    g.fillStyle = halo;
    g.fillRect(0, 0, cell, cell);
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cx, r, 0, Math.PI * 2);
    g.fill();
    return c;
  });
}

export default function LedMatrix({ ref, onCell, captureTouch = false, ariaLabel }: LedMatrixProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<HTMLCanvasElement[]>([]);
  const cellRef = useRef(0);
  const lastFrameRef = useRef<Frame | null>(null);
  const draggingRef = useRef(false);

  const paint = useCallback((frame: Frame) => {
    lastFrameRef.current = frame;
    const canvas = canvasRef.current;
    const cell = cellRef.current;
    const sprites = spritesRef.current;
    if (!canvas || cell === 0 || sprites.length === 0) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.fillStyle = '#000000';
    g.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        g.drawImage(sprites[frame[y * W + x]] ?? sprites[0], x * cell, y * cell);
      }
    }
  }, []);

  // Size the canvas to its container (2:1) at device pixel ratio.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cs = getComputedStyle(wrap);
      const cssWidth = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const cell = Math.max(2, Math.floor((cssWidth * dpr) / W));
      cellRef.current = cell;
      canvas.width = cell * W;
      canvas.height = cell * H;
      canvas.style.width = `${(cell * W) / dpr}px`;
      canvas.style.height = `${(cell * H) / dpr}px`;
      spritesRef.current = buildDotSprites(cell);
      if (lastFrameRef.current) paint(lastFrameRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [paint]);

  useImperativeHandle(ref, () => ({
    draw: paint,
    toPngBlob: (frame, scale) => {
      const c = document.createElement('canvas');
      c.width = W * scale;
      c.height = H * scale;
      const g = c.getContext('2d')!;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          g.fillStyle = PALETTE[frame[y * W + x]] ?? PALETTE[0];
          g.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
    },
  }), [paint]);

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * H);
    if (x < 0 || x >= W || y < 0 || y >= H) return null;
    return [x, y];
  };

  const handle = (phase: PointerPhase) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onCell) return;
    if (phase === 'down') {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (phase === 'move' && !draggingRef.current) {
      return;
    } else if (phase === 'up') {
      draggingRef.current = false;
    }
    const cell = cellAt(e);
    if (cell) onCell(cell[0], cell[1], phase);
    else if (phase === 'up') onCell(-1, -1, 'up');
  };

  return (
    <div
      ref={wrapRef}
      className="w-full rounded-2xl p-2 sm:p-3"
      style={{ background: '#000000', border: '1px solid #2C2C2E' }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel ?? 'Panel LED'}
        className="block mx-auto select-none"
        style={{ touchAction: captureTouch ? 'none' : 'auto', imageRendering: 'pixelated' }}
        onPointerDown={handle('down')}
        onPointerMove={handle('move')}
        onPointerUp={handle('up')}
        onPointerCancel={handle('up')}
      />
    </div>
  );
}
