import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { useGym } from '../../contexts/GymContext';
import { getCourts } from '../../data/api';
import type { Court } from '../../types/court';

interface LiveCourt {
  courtId: string;
  name: string;
  active: boolean;
  format: string | null;
  scoreA: number;
  scoreB: number;
  elapsedMin: number;
}

const FORMATS = ['1v1', '2v2', '3v3'];

function randomActivity(court: Court): LiveCourt {
  const active = Math.random() > 0.4;
  return {
    courtId: court.id,
    name: court.name,
    active: active && court.status === 'online',
    format: active ? FORMATS[Math.floor(Math.random() * FORMATS.length)] : null,
    scoreA: active ? Math.floor(Math.random() * 21) : 0,
    scoreB: active ? Math.floor(Math.random() * 21) : 0,
    elapsedMin: active ? Math.floor(Math.random() * 40) + 1 : 0,
  };
}

export default function LiveActivityPanel() {
  const { currentGym } = useGym();
  const [courts, setCourts] = useState<Court[]>([]);
  const [liveCourts, setLiveCourts] = useState<LiveCourt[]>([]);

  useEffect(() => {
    getCourts(currentGym?.id).then(setCourts);
  }, [currentGym?.id]);

  useEffect(() => {
    if (courts.length === 0) return;
    // Initial state
    setLiveCourts(courts.map(randomActivity));

    const interval = setInterval(() => {
      setLiveCourts(courts.map(randomActivity));
    }, 5000);

    return () => clearInterval(interval);
  }, [courts]);

  if (liveCourts.length === 0) return null;

  const activeCount = liveCourts.filter((c) => c.active).length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BFF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7BFF00]" />
          </span>
          <h2 className="text-sm font-medium text-white">Actividad en vivo</h2>
        </div>
        <span className="text-xs text-[#8E8E93]">{activeCount} canchas activas</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {liveCourts.map((lc) => (
          <div
            key={lc.courtId}
            className={`rounded-xl p-3 border transition-all duration-500 ${
              lc.active
                ? 'bg-[#7BFF00]/5 border-[#7BFF00]/30'
                : 'bg-[#2C2C2E]/50 border-[#2C2C2E]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  lc.active ? 'bg-[#7BFF00] animate-pulse' : 'bg-[#636366]'
                }`}
              />
              <span className="text-xs font-medium text-white truncate">{lc.name}</span>
            </div>
            {lc.active ? (
              <>
                <p className="text-xs text-[#8E8E93]">{lc.format}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {lc.scoreA} - {lc.scoreB}
                </p>
                <p className="text-[10px] text-[#636366]">{lc.elapsedMin} min</p>
              </>
            ) : (
              <p className="text-xs text-[#636366] mt-1">Libre</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
