import { type Frame, CYAN, GREEN, RED, VIOLET, W, WHITE, YELLOW, blitSprite, clear, setPixel } from '../matrix';
import { drawText, drawTextCentered, textWidth } from '../font';
import {
  FLYING_ALIEN, GROUND_ALIEN, PLAYER_COLORS, PLAYER_H, PLAYER_JUMP, PLAYER_RUN_A, PLAYER_RUN_B, PLAYER_W,
} from './sprites';

// ── Tuning ───────────────────────────────────────────────────────────────────
export const STEP_MS = 1000 / 60;
/** Row the player's feet stand on; the ground line is drawn just below. */
const GROUND_Y = 28;
const PLAYER_X = 6;
/** Jump apex ≈14 px and ≈520 ms airtime: clears ground and low flying aliens. */
const JUMP_VELOCITY = 0.1077; // px/ms (upwards)
const GRAVITY = 0.000414; // px/ms²
const START_SPEED = 0.035; // px/ms
const MAX_SPEED = 0.09;
const SPEED_GAIN = 0.0000009; // px/ms per ms survived
const FLYERS_FROM_SCORE = 150;
const AIRTIME_MS = (2 * JUMP_VELOCITY) / GRAVITY;

type AlienKind = 'ground' | 'low' | 'high';

interface Alien {
  kind: AlienKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
}

interface Star {
  x: number;
  y: number;
}

export type GameStatus = 'ready' | 'running' | 'paused' | 'over';

export interface GameState {
  status: GameStatus;
  /** Player feet offset above the ground (px, ≥ 0). */
  playerY: number;
  velocityY: number;
  speed: number;
  distance: number;
  score: number;
  highScore: number;
  aliens: Alien[];
  stars: Star[];
  nextSpawnIn: number;
  elapsedMs: number;
  rng: number;
  newRecord: boolean;
  /** After dying, ignore input briefly so a held jump doesn't restart instantly. */
  restartCooldownMs: number;
}

const RESTART_COOLDOWN_MS = 500;

export interface GameInput {
  /** Jump/start/restart pressed since the last step. */
  action: boolean;
}

export interface StepResult {
  died: boolean;
}

function rand(state: GameState): number {
  state.rng = (state.rng * 1664525 + 1013904223) >>> 0;
  return state.rng / 0x100000000;
}

export function createGame(highScore = 0, seed = Date.now()): GameState {
  const state: GameState = {
    status: 'ready',
    playerY: 0,
    velocityY: 0,
    speed: START_SPEED,
    distance: 0,
    score: 0,
    highScore,
    aliens: [],
    stars: [],
    nextSpawnIn: 40,
    elapsedMs: 0,
    rng: seed >>> 0,
    newRecord: false,
    restartCooldownMs: 0,
  };
  for (let i = 0; i < 8; i++) {
    state.stars.push({ x: Math.floor(rand(state) * W), y: 1 + Math.floor(rand(state) * 14) });
  }
  return state;
}

/** Starts (or restarts after game over) keeping the high score. */
function restart(state: GameState): void {
  const fresh = createGame(state.highScore, state.rng);
  Object.assign(state, fresh, { status: 'running' as GameStatus });
}

export function togglePause(state: GameState): void {
  if (state.status === 'running') state.status = 'paused';
  else if (state.status === 'paused') state.status = 'running';
}

export function pause(state: GameState): void {
  if (state.status === 'running') state.status = 'paused';
}

function spawnAlien(state: GameState): void {
  const r = rand(state);
  const canFly = state.score >= FLYERS_FROM_SCORE;
  const colors = [RED, VIOLET, CYAN, YELLOW];
  const color = colors[Math.floor(rand(state) * colors.length)];
  if (canFly && r < 0.2) {
    // High flyer: passes over a standing player, hits a jumping one.
    state.aliens.push({ kind: 'high', x: W, y: GROUND_Y - PLAYER_H - 7, w: 6, h: 5, color });
  } else if (canFly && r < 0.4) {
    // Low flyer: at chest height, must be jumped.
    state.aliens.push({ kind: 'low', x: W, y: GROUND_Y - 9, w: 6, h: 5, color });
  } else {
    state.aliens.push({ kind: 'ground', x: W, y: GROUND_Y - 5, w: 8, h: 6, color });
  }
  // Minimum gap = distance travelled during a full jump + margin, so every
  // obstacle stays avoidable at the current speed.
  const minGap = state.speed * AIRTIME_MS + 14;
  state.nextSpawnIn = minGap + rand(state) * 40;
}

function collides(state: GameState): boolean {
  // Player hitbox with 1 px courtesy margin on every side.
  const top = GROUND_Y - state.playerY - PLAYER_H + 1;
  const px0 = PLAYER_X + 1;
  const px1 = PLAYER_X + PLAYER_W - 2;
  const py0 = top + 1;
  const py1 = GROUND_Y - state.playerY - 1;
  return state.aliens.some((a) => {
    const ax0 = a.x + 1;
    const ax1 = a.x + a.w - 2;
    const ay0 = a.y + 1;
    const ay1 = a.y + a.h - 1;
    return px0 <= ax1 && px1 >= ax0 && py0 <= ay1 && py1 >= ay0;
  });
}

/** Advances the simulation by one fixed step. Mutates and returns events. */
export function step(state: GameState, input: GameInput): StepResult {
  if (state.status === 'ready' || state.status === 'over') {
    if (state.restartCooldownMs > 0) {
      state.restartCooldownMs -= STEP_MS;
      return { died: false };
    }
    if (input.action) {
      restart(state);
      state.velocityY = JUMP_VELOCITY;
    }
    return { died: false };
  }
  if (state.status !== 'running') return { died: false };

  const dt = STEP_MS;
  state.elapsedMs += dt;

  if (input.action && state.playerY === 0) state.velocityY = JUMP_VELOCITY;
  if (state.playerY > 0 || state.velocityY > 0) {
    state.playerY += state.velocityY * dt;
    state.velocityY -= GRAVITY * dt;
    if (state.playerY <= 0) {
      state.playerY = 0;
      state.velocityY = 0;
    }
  }

  state.speed = Math.min(MAX_SPEED, START_SPEED + state.elapsedMs * SPEED_GAIN);
  const dx = state.speed * dt;
  state.distance += dx;
  state.score = Math.floor(state.distance / 4);

  for (const a of state.aliens) a.x -= dx;
  state.aliens = state.aliens.filter((a) => a.x + a.w > -1);
  for (const s of state.stars) {
    s.x -= dx * 0.25;
    if (s.x < 0) s.x += W;
  }

  state.nextSpawnIn -= dx;
  if (state.nextSpawnIn <= 0) spawnAlien(state);

  if (collides(state)) {
    state.status = 'over';
    state.restartCooldownMs = RESTART_COOLDOWN_MS;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      state.newRecord = true;
    }
    return { died: true };
  }
  return { died: false };
}

export function render(state: GameState, frame: Frame, nowMs: number): void {
  clear(frame);
  for (const s of state.stars) setPixel(frame, Math.floor(s.x), s.y, WHITE);

  // Ground line with scrolling gaps so motion reads even with no obstacles.
  const offset = Math.floor(state.distance) % 6;
  for (let x = 0; x < W; x++) {
    if ((x + offset) % 6 !== 0) setPixel(frame, x, GROUND_Y + 1, GREEN);
  }

  const animFrame = Math.floor(nowMs / 250) % 2;
  for (const a of state.aliens) {
    const sprite = a.kind === 'ground' ? GROUND_ALIEN[animFrame] : FLYING_ALIEN[animFrame];
    blitSprite(frame, sprite, Math.round(a.x), a.y, a.color);
  }

  const airborne = state.playerY > 0;
  const runFrame = Math.floor(state.distance / 5) % 2 === 0 ? PLAYER_RUN_A : PLAYER_RUN_B;
  const sprite = airborne ? PLAYER_JUMP : state.status === 'running' ? runFrame : PLAYER_RUN_A;
  const top = Math.round(GROUND_Y - state.playerY - PLAYER_H + 1);
  blitSprite(frame, sprite, PLAYER_X, top, WHITE, PLAYER_COLORS);

  // HUD, right-aligned: the player's jump apex reaches the top-left corner.
  const sc = String(state.score);
  const scX = W - textWidth(sc) - 1;
  drawText(frame, sc, scX, 1, GREEN);
  // Keep the record clear of the player column (x ≤ 13); shorten it, or drop it, when scores get long.
  const minHudX = PLAYER_X + PLAYER_W + 1;
  for (const hi of [`HI ${state.highScore}`, String(state.highScore)]) {
    const x = scX - textWidth(hi) - 4;
    if (x >= minHudX) {
      drawText(frame, hi, x, 1, WHITE);
      break;
    }
  }

  if (state.status === 'ready') {
    drawTextCentered(frame, 'HOOP RUNNER', 9, GREEN);
    if (Math.floor(nowMs / 500) % 2 === 0) drawTextCentered(frame, 'PULSA PARA JUGAR', 16, WHITE);
  } else if (state.status === 'paused') {
    drawTextCentered(frame, 'PAUSA', 12, YELLOW);
  } else if (state.status === 'over') {
    drawTextCentered(frame, 'GAME OVER', 9, RED);
    if (state.newRecord) drawTextCentered(frame, 'NUEVO RECORD!', 16, YELLOW);
    else if (Math.floor(nowMs / 500) % 2 === 0) drawTextCentered(frame, 'OTRA VEZ?', 16, WHITE);
  }
}
