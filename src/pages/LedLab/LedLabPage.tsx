import { useState } from 'react';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import DrawTab from './DrawTab';
import TimerTab from './TimerTab';
import GameTab from './GameTab';

type TabId = 'draw' | 'timer' | 'game';

const TABS = [
  { id: 'draw', label: 'Dibujar' },
  { id: 'timer', label: 'Timer' },
  { id: 'game', label: 'Juego' },
];

/**
 * Hidden test page (/gym/:gymId/lab, not in the navigation): a pixel LED
 * panel inspired by the hoop scoreboard. Each tab mounts its own panel so
 * leaving a tab stops its animation loop.
 */
export default function LedLabPage() {
  const [tab, setTab] = useState<TabId>('draw');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl text-white leading-none">LED Lab</h1>
          <Badge variant="yellow">Prueba</Badge>
        </div>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">
          Panel LED pixelado de 64×32 inspirado en el marcador de la canasta
        </p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'draw' && <DrawTab />}
      {tab === 'timer' && <TimerTab />}
      {tab === 'game' && <GameTab />}
    </div>
  );
}
