import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import LedMatrix, { type LedMatrixHandle, type PointerPhase } from './LedMatrix';
import { createFrame } from './matrix';
import { type GameState, STEP_MS, createGame, pause, render, step, togglePause } from './game/engine';
import { HIGHSCORE_KEY, loadItem, saveItem } from './storage';

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
/** Avoid a death spiral if the tab stalls (e.g. debugger, slow device). */
const MAX_FRAME_MS = 250;

function loadHighScore(): number {
  const n = Number(loadItem(HIGHSCORE_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export default function GameTab() {
  const matrixRef = useRef<LedMatrixHandle>(null);
  const [initialGame] = useState(() => createGame(loadHighScore()));
  const gameRef = useRef<GameState>(initialGame);
  const actionRef = useRef(false);
  const [status, setStatus] = useState(initialGame.status);
  const [highScore, setHighScore] = useState(initialGame.highScore);

  useEffect(() => {
    const game = gameRef.current;
    const frame = createFrame();
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let shownStatus = game.status;
    const loop = (now: number) => {
      acc += Math.min(MAX_FRAME_MS, now - last);
      last = now;
      while (acc >= STEP_MS) {
        const action = actionRef.current;
        actionRef.current = false;
        const { died } = step(game, { action });
        if (died && game.newRecord) {
          saveItem(HIGHSCORE_KEY, String(game.highScore));
          setHighScore(game.highScore);
        }
        acc -= STEP_MS;
      }
      render(game, frame, now);
      matrixRef.current?.draw(frame);
      if (game.status !== shownStatus) {
        shownStatus = game.status;
        setStatus(game.status);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (JUMP_KEYS.has(e.code)) {
        e.preventDefault();
        actionRef.current = true;
      } else if (e.code === 'KeyP') {
        togglePause(game);
      }
    };
    const onVisibility = () => {
      if (document.hidden) pause(game);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      pause(game);
    };
  }, []);

  const onCell = (_x: number, _y: number, phase: PointerPhase) => {
    if (phase !== 'down') return;
    if (gameRef.current.status === 'paused') togglePause(gameRef.current);
    else actionRef.current = true;
  };

  return (
    <div className="space-y-4">
      <LedMatrix ref={matrixRef} onCell={onCell} captureTouch ariaLabel="Juego Hoop Runner en el panel LED" />

      <div className="flex flex-wrap items-center gap-3">
        {status === 'running' ? (
          <Button variant="secondary" onClick={() => togglePause(gameRef.current)}>
            <Pause size={16} /> Pausar
          </Button>
        ) : status === 'paused' ? (
          <Button onClick={() => togglePause(gameRef.current)}>
            <Play size={16} /> Continuar
          </Button>
        ) : (
          <Button onClick={() => { actionRef.current = true; }}>
            <Play size={16} /> {status === 'over' ? 'Otra vez' : 'Jugar'}
          </Button>
        )}
        <span className="text-sm text-[#8E8E93]">
          Récord: <span className="text-white font-semibold">{highScore}</span>
        </span>
      </div>

      <p className="text-xs text-[#636366]">
        Salta con <kbd className="text-[#8E8E93]">Espacio</kbd> / <kbd className="text-[#8E8E93]">↑</kbd> o
        tocando el panel. Pausa con <kbd className="text-[#8E8E93]">P</kbd>. A partir de 150 puntos aparecen
        marcianitos voladores: a los bajos hay que saltarlos y bajo los altos hay que quedarse en el suelo.
      </p>
    </div>
  );
}
