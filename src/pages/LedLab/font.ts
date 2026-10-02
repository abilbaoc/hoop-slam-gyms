import { type Frame, fillRect, setPixel } from './matrix';

// ── 3×5 pixel font ───────────────────────────────────────────────────────────

const GLYPHS: Record<string, readonly string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['...', '...', '...', '...', '...'],
  ':': ['...', '.#.', '...', '.#.', '...'],
  '-': ['...', '...', '###', '...', '...'],
  '.': ['...', '...', '...', '...', '.#.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
};

export const GLYPH_W = 3;
export const GLYPH_H = 5;

export function textWidth(text: string): number {
  return text.length === 0 ? 0 : text.length * (GLYPH_W + 1) - 1;
}

export function drawText(frame: Frame, text: string, x: number, y: number, color: number): void {
  let cx = x;
  for (const raw of text.toUpperCase()) {
    const glyph = GLYPHS[raw] ?? GLYPHS['?'];
    for (let row = 0; row < GLYPH_H; row++) {
      for (let col = 0; col < GLYPH_W; col++) {
        if (glyph[row][col] === '#') setPixel(frame, cx + col, y + row, color);
      }
    }
    cx += GLYPH_W + 1;
  }
}

/** Draws text horizontally centred on the 64-wide matrix. */
export function drawTextCentered(frame: Frame, text: string, y: number, color: number, width = 64): void {
  drawText(frame, text, Math.floor((width - textWidth(text)) / 2), y, color);
}

// ── 7-segment digits (same table and segment order as firmware DigitMap.h) ──
// Segment order: [0] upper-left, [1] top, [2] upper-right, [3] middle,
//                [4] lower-left, [5] bottom, [6] lower-right.

export type Segments = readonly [number, number, number, number, number, number, number];

export const DIGIT_SEGMENTS: readonly Segments[] = [
  [1, 1, 1, 0, 1, 1, 1],
  [0, 0, 1, 0, 0, 0, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 1, 1],
  [1, 0, 1, 1, 0, 0, 1],
  [1, 1, 0, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 1],
];

/** The 4 letters firmware CharMap.h supports (used for the boot "HOLA"). */
export const CHAR_SEGMENTS: Readonly<Record<string, Segments>> = {
  H: [1, 0, 1, 1, 1, 0, 1],
  O: [1, 1, 1, 0, 1, 1, 1],
  L: [1, 0, 0, 0, 1, 1, 0],
  A: [1, 1, 1, 1, 1, 0, 1],
};

/** Draws one 7-segment glyph in a w×h box with bars `t` pixels thick. */
export function drawSevenSeg(
  frame: Frame,
  segs: Segments,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  color: number,
): void {
  const mid = y + Math.floor((h - t) / 2);
  const upperH = mid - (y + t);
  const lowerH = y + h - t - (mid + t);
  // Horizontal bars leave the corners free so segments read as separate LEDs.
  if (segs[1]) fillRect(frame, x + t, y, w - 2 * t, t, color);
  if (segs[3]) fillRect(frame, x + t, mid, w - 2 * t, t, color);
  if (segs[5]) fillRect(frame, x + t, y + h - t, w - 2 * t, t, color);
  if (segs[0]) fillRect(frame, x, y + t, t, upperH, color);
  if (segs[2]) fillRect(frame, x + w - t, y + t, t, upperH, color);
  if (segs[4]) fillRect(frame, x, mid + t, t, lowerH, color);
  if (segs[6]) fillRect(frame, x + w - t, mid + t, t, lowerH, color);
}

export function drawSevenSegDigit(
  frame: Frame,
  digit: number,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  color: number,
): void {
  const segs = DIGIT_SEGMENTS[Math.max(0, Math.min(9, Math.floor(digit)))];
  drawSevenSeg(frame, segs, x, y, w, h, t, color);
}

/** Two-digit number 00–99 (like the hoop's score markers). */
export function drawTwoDigits(
  frame: Frame,
  value: number,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  gap: number,
  color: number,
): void {
  const v = Math.max(0, Math.min(99, Math.floor(value)));
  drawSevenSegDigit(frame, Math.floor(v / 10), x, y, w, h, t, color);
  drawSevenSegDigit(frame, v % 10, x + w + gap, y, w, h, t, color);
}
