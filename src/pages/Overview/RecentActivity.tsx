import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { useGym } from '../../contexts/GymContext';
import { getRecentMatchesData } from '../../data/api';
import type { RecentMatch } from '../../types';
import FormatBadge from '../../components/shared/FormatBadge';

export default function RecentActivity() {
  const { currentGym } = useGym();
  const [matches, setMatches] = useState<RecentMatch[]>([]);

  useEffect(() => {
    getRecentMatchesData(10, currentGym?.id).then(setMatches);
  }, [currentGym?.id]);

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-4">Actividad reciente</h3>
      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between py-2 border-b border-[#2C2C2E] last:border-0"
          >
            <div className="flex items-center gap-3">
              <FormatBadge format={m.format} />
              <div>
                <p className="text-sm text-white font-medium">
                  {m.scoreA} - {m.scoreB}
                </p>
                <p className="text-xs text-[#8E8E93]">{m.courtName}</p>
              </div>
            </div>
            <span className="text-xs text-[#636366]">{m.time}</span>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="text-sm text-[#8E8E93] text-center py-8">Cargando...</p>
        )}
      </div>
    </Card>
  );
}
