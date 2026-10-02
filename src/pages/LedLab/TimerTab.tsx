import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import LedMatrix, { type LedMatrixHandle } from './LedMatrix';
import { type Frame, GREEN, PALETTE, RED, WHITE, clear, createFrame, fillRect, setPixel, W, H } from './matrix';
import { drawSevenSegDigit, drawTextCentered, drawTwoDigits } from './font';

type Mode = 'countdown' | 'stopwatch';

const DEFAULT_MS = 10 * 60 * 1000; // firmware TIMER_INITIAL_SEC = 600
const MAX_MS = (99 * 60 + 59) * 1000;
const WARNING_MS = 10_000;
const CELEBRATION_MS = 3_000;
const PRESETS = [
  { label: '10:00', ms: 10 * 60_000 },
  { label: '5:00', ms: 5 * 60_000 },
  { label: '1:00', ms: 60_000 },
  { label: '0:15', ms: 15_000 },
];

function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Same layout logic as the hoop: two score markers on top, MM:SS timer below. */
function renderScoreboard(
  frame: Frame,
  scoreA: number,
  scoreB: number,
  shownMs: number,
  timerColor: number,
  timerVisible: boolean,
): void {
  clear(frame);
  drawTwoDigits(frame, scoreA, 2, 1, 6, 11, 1, 2, GREEN);
  drawTwoDigits(frame, scoreB, 48, 1, 6, 11, 1, 2, GREEN);
  drawTextCentered(frame, 'VS', 4, WHITE);
  if (!timerVisible) return;
  const total = Math.ceil(shownMs / 1000);
  const mm = Math.min(99, Math.floor(total / 60));
  const ss = total % 60;
  const y = 15;
  drawSevenSegDigit(frame, Math.floor(mm / 10), 5, y, 11, 15, 2, timerColor);
  drawSevenSegDigit(frame, mm % 10, 18, y, 11, 15, 2, timerColor);
  fillRect(frame, 31, y + 3, 2, 2, timerColor);
  fillRect(frame, 31, y + 10, 2, 2, timerColor);
  drawSevenSegDigit(frame, Math.floor(ss / 10), 35, y, 11, 15, 2, timerColor);
  drawSevenSegDigit(frame, ss % 10, 48, y, 11, 15, 2, timerColor);
}

/** "GameEnded" confetti: random sparkles over the board. */
function sprinkleConfetti(frame: Frame, seed: number): void {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = 0; i < 40; i++) {
    setPixel(frame, Math.floor(rand() * W), Math.floor(rand() * H), 1 + Math.floor(rand() * (PALETTE.length - 1)));
  }
}

export default function TimerTab() {
  const matrixRef = useRef<LedMatrixHandle>(null);
  const frameRef = useRef<Frame>(createFrame());
  const [mode, setMode] = useState<Mode>('countdown');
  const [durationMs, setDurationMs] = useState(DEFAULT_MS);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0); // accumulated while paused
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const finishedAtRef = useRef<number | null>(null);
  const lastKeyRef = useRef('');
  const [shownLabel, setShownLabel] = useState(formatMs(DEFAULT_MS));

  // Live state the animation loop reads without re-subscribing.
  const live = useRef({ mode, durationMs, running, elapsedMs, scoreA, scoreB });
  useLayoutEffect(() => {
    live.current = { mode, durationMs, running, elapsedMs, scoreA, scoreB };
  }, [mode, durationMs, running, elapsedMs, scoreA, scoreB]);

  const currentElapsed = (now: number) => {
    const l = live.current;
    const extra = l.running && startedAtRef.current !== null ? now - startedAtRef.current : 0;
    return l.elapsedMs + extra;
  };

  useEffect(() => {
    let raf = 0;
    let lastLabelSec = -1;
    const loop = (now: number) => {
      const l = live.current;
      const elapsed = currentElapsed(now);
      let shown: number;
      let color = GREEN;
      let visible = true;
      let confetti = false;

      if (l.mode === 'countdown') {
        shown = Math.max(0, l.durationMs - elapsed);
        if (shown === 0 && l.running) {
          // Reached zero: stop and start the celebration. Update the live
          // snapshot now too, otherwise the next frame (before React
          // re-renders) would read the stale state and flash the start time.
          finishedAtRef.current = now;
          startedAtRef.current = null;
          live.current = { ...l, running: false, elapsedMs: l.durationMs };
          setRunning(false);
          setElapsedMs(l.durationMs);
        }
        if (shown > 0 && shown <= WARNING_MS) {
          color = RED;
          if (l.running) visible = Math.floor(now / 250) % 2 === 0; // ReservationEnding blink
        }
        if (shown === 0) {
          color = RED;
          const since = finishedAtRef.current !== null ? now - finishedAtRef.current : Infinity;
          if (since < CELEBRATION_MS) {
            confetti = true;
            visible = Math.floor(now / 200) % 2 === 0;
          }
        }
      } else {
        shown = Math.min(MAX_MS, elapsed);
        if (shown >= MAX_MS && l.running) {
          startedAtRef.current = null;
          live.current = { ...l, running: false, elapsedMs: MAX_MS };
          setRunning(false);
          setElapsedMs(MAX_MS);
        }
      }

      const confettiTick = confetti ? Math.floor(now / 100) : -1;
      const key = `${l.scoreA}|${l.scoreB}|${Math.ceil(shown / 1000)}|${color}|${visible}|${confettiTick}`;
      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        const frame = frameRef.current;
        renderScoreboard(frame, l.scoreA, l.scoreB, shown, color, visible);
        if (confetti) sprinkleConfetti(frame, confettiTick);
        matrixRef.current?.draw(frame);
      }
      const sec = Math.ceil(shown / 1000);
      if (sec !== lastLabelSec) {
        lastLabelSec = sec;
        setShownLabel(formatMs(shown));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Timer transitions update the loop's live snapshot immediately as well as
  // React state, so no frame renders with half-updated values.
  const start = () => {
    if (running) return;
    const done = mode === 'countdown' ? elapsedMs >= durationMs : elapsedMs >= MAX_MS;
    const from = done ? 0 : elapsedMs;
    finishedAtRef.current = null;
    startedAtRef.current = performance.now();
    live.current = { ...live.current, running: true, elapsedMs: from };
    setElapsedMs(from);
    setRunning(true);
  };

  const pause = () => {
    if (!running) return;
    const elapsed = currentElapsed(performance.now());
    startedAtRef.current = null;
    live.current = { ...live.current, running: false, elapsedMs: elapsed };
    setElapsedMs(elapsed);
    setRunning(false);
  };

  const reset = () => {
    startedAtRef.current = null;
    finishedAtRef.current = null;
    live.current = { ...live.current, running: false, elapsedMs: 0 };
    setRunning(false);
    setElapsedMs(0);
  };

  const setPreset = (ms: number) => {
    reset();
    setMode('countdown');
    setDurationMs(ms);
  };

  const adjust = (deltaMs: number) => {
    setDurationMs((d) => Math.min(MAX_MS, Math.max(5_000, d + deltaMs)));
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  const scoreControls = (label: string, value: number, set: (fn: (v: number) => number) => void) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#8E8E93] w-16">{label}</span>
      <Button variant="secondary" size="sm" onClick={() => set((v) => Math.max(0, v - 1))} aria-label={`Restar punto ${label}`}>
        <Minus size={14} />
      </Button>
      <span className="font-display text-2xl text-white w-10 text-center">{value}</span>
      <Button variant="secondary" size="sm" onClick={() => set((v) => Math.min(99, v + 1))} aria-label={`Sumar punto ${label}`}>
        <Plus size={14} />
      </Button>
    </div>
  );

  const editable = !running && mode === 'countdown';

  return (
    <div className="space-y-4">
      <LedMatrix ref={matrixRef} ariaLabel={`Marcador ${scoreA} a ${scoreB}, tiempo ${shownLabel}`} />

      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <Button onClick={pause}><Pause size={16} /> Pausar</Button>
        ) : (
          <Button onClick={start}><Play size={16} /> Iniciar</Button>
        )}
        <Button variant="secondary" onClick={reset}><RotateCcw size={16} /> Reset</Button>
        <span className="w-px h-6 bg-[#2C2C2E] mx-1" />
        <Button variant={mode === 'countdown' ? 'primary' : 'secondary'} size="sm" onClick={() => switchMode('countdown')}>
          Cuenta atrás
        </Button>
        <Button variant={mode === 'stopwatch' ? 'primary' : 'secondary'} size="sm" onClick={() => switchMode('stopwatch')}>
          Cronómetro
        </Button>
      </div>

      {mode === 'countdown' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#8E8E93]">Duración</span>
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant={durationMs === p.ms ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPreset(p.ms)}
              disabled={running}
            >
              {p.label}
            </Button>
          ))}
          <span className="w-px h-6 bg-[#2C2C2E] mx-1" />
          <Button variant="ghost" size="sm" onClick={() => adjust(-60_000)} disabled={!editable}>−1 min</Button>
          <Button variant="ghost" size="sm" onClick={() => adjust(60_000)} disabled={!editable}>+1 min</Button>
          <Button variant="ghost" size="sm" onClick={() => adjust(-10_000)} disabled={!editable}>−10 s</Button>
          <Button variant="ghost" size="sm" onClick={() => adjust(10_000)} disabled={!editable}>+10 s</Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {scoreControls('Equipo A', scoreA, setScoreA)}
        {scoreControls('Equipo B', scoreB, setScoreB)}
        <Button variant="ghost" size="sm" onClick={() => { setScoreA(0); setScoreB(0); }}>
          Marcador a 0
        </Button>
      </div>

      <p className="text-xs text-[#636366]">
        Imita el marcador real de la canasta: dígitos de 7 segmentos en verde, partido de 10:00 por defecto
        y parpadeo en rojo en los últimos 10 segundos.
      </p>
    </div>
  );
}
