import type { Sprite } from '../matrix';
import { GREEN, ORANGE, WHITE } from '../matrix';

// Legend: h = head, g = jersey, s = shorts, l = legs, o = ball.
export const PLAYER_COLORS: Readonly<Record<string, number>> = {
  h: WHITE, g: GREEN, s: WHITE, l: WHITE, o: ORANGE,
};

/** Running, ball high in the dribble. */
export const PLAYER_RUN_A: Sprite = [
  '..hh....',
  '..hh....',
  '.gggg...',
  'g.gg.g..',
  'g.gg..g.',
  '..gg..oo',
  '..ss..oo',
  '..ss....',
  '.l..l...',
  '.l...l..',
  'l....l..',
  'l.....l.',
];

/** Running, ball low in the dribble. */
export const PLAYER_RUN_B: Sprite = [
  '..hh....',
  '..hh....',
  '.gggg...',
  'g.gg.g..',
  'g.gg..g.',
  '..gg..g.',
  '..ss....',
  '..ss....',
  '..ll..oo',
  '..ll..oo',
  '..l.l...',
  '..l.l...',
];

/** Jumping in a shooting pose, ball overhead. */
export const PLAYER_JUMP: Sprite = [
  '..hh..oo',
  '..hh.goo',
  '.gggg.g.',
  'g.gg....',
  '..gg....',
  '..gg....',
  '..ss....',
  '..ss....',
  '.l..l...',
  'l....l..',
  '........',
  '........',
];

export const PLAYER_W = 8;
export const PLAYER_H = 12;

/** Ground "crab" invader, two animation frames. */
export const GROUND_ALIEN: readonly [Sprite, Sprite] = [
  [
    '..#..#..',
    '...##...',
    '..####..',
    '.##..##.',
    '########',
    '#.#..#.#',
  ],
  [
    '..#..#..',
    '#..##..#',
    '#.####.#',
    '.##..##.',
    '########',
    '.#....#.',
  ],
];

/** Flying "squid" invader, two animation frames. */
export const FLYING_ALIEN: readonly [Sprite, Sprite] = [
  [
    '..##..',
    '.####.',
    '##..##',
    '######',
    '.#..#.',
  ],
  [
    '..##..',
    '.####.',
    '##..##',
    '######',
    '#....#',
  ],
];
