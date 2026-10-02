/** Conceptual LED matrix (HUB75-style 64×32). The real hoop scoreboard is 7-segment digits, not a matrix. */
export const W = 64;
export const H = 32;

/** One byte per LED: index into PALETTE (0 = off). */
export type Frame = Uint8Array;

export const OFF = 0;
export const GREEN = 1;
export const RED = 2;
export const WHITE = 3;
export const YELLOW = 4;
export const CYAN = 5;
export const ORANGE = 6;
export const VIOLET = 7;

export const PALETTE: readonly string[] = [
  '#000000',
  '#7BFF00',
  '#FF2D2D',
  '#FFFFFF',
  '#FFD93D',
  '#00D4FF',
  '#FF9F0A',
  '#C084FC',
];

export const COLOR_NAMES: readonly string[] = [
  'Apagado', 'Verde', 'Rojo', 'Blanco', 'Amarillo', 'Cian', 'Naranja', 'Violeta',
];

/** A sprite is rows of strings: '.' = transparent, any other char = lit. */
export type Sprite = readonly string[];

export function createFrame(): Frame {
  return new Uint8Array(W * H);
}

export function clear(frame: Frame): void {
  frame.fill(OFF);
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < W && y >= 0 && y < H;
}

export function setPixel(frame: Frame, x: number, y: number, color: number): void {
  if (inBounds(x, y)) frame[y * W + x] = color;
}

export function getPixel(frame: Frame, x: number, y: number): number {
  return inBounds(x, y) ? frame[y * W + x] : OFF;
}

export function fillRect(frame: Frame, x: number, y: number, w: number, h: number, color: number): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(frame, xx, yy, color);
  }
}

/** Draws a sprite; chars map to colors via `colors` (fallback: `color`). */
export function blitSprite(
  frame: Frame,
  sprite: Sprite,
  x: number,
  y: number,
  color: number,
  colors: Readonly<Record<string, number>> = {},
): void {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.' || ch === ' ') continue;
      setPixel(frame, x + col, y + row, colors[ch] ?? color);
    }
  }
}

/** 4-connected flood fill (iterative, safe on the 2048-cell grid). */
export function floodFill(frame: Frame, x: number, y: number, color: number): void {
  if (!inBounds(x, y)) return;
  const target = getPixel(frame, x, y);
  if (target === color) return;
  const stack = [y * W + x];
  while (stack.length > 0) {
    const i = stack.pop()!;
    if (frame[i] !== target) continue;
    frame[i] = color;
    const px = i % W;
    const py = (i - px) / W;
    if (px > 0) stack.push(i - 1);
    if (px < W - 1) stack.push(i + 1);
    if (py > 0) stack.push(i - W);
    if (py < H - 1) stack.push(i + W);
  }
}

export function frameToBase64(frame: Frame): string {
  let s = '';
  for (let i = 0; i < frame.length; i++) s += String.fromCharCode(frame[i]);
  return btoa(s);
}

export function frameFromBase64(data: string): Frame | null {
  try {
    const s = atob(data);
    if (s.length !== W * H) return null;
    const frame = createFrame();
    for (let i = 0; i < s.length; i++) {
      const v = s.charCodeAt(i);
      frame[i] = v < PALETTE.length ? v : OFF;
    }
    return frame;
  } catch {
    return null;
  }
}
