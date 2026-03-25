import { useState, useEffect } from 'react';
import { Trophy, Users, Filter } from 'lucide-react';
import { useGymLayout } from '../../layouts/GymLayout';
import { getMatches } from '../../data/api';
import type { Match, MatchFormat } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const FORMAT_LABEL: Record<MatchFormat, string> = { '1v1': '1 vs 1', '2v2': '2 vs 2', '3v3': '3 vs 3' };
const FORMAT_COLOR: Record<MatchFormat, 'green' | 'blue' | 'yellow'> = { '1v1': 'green', '2v2': 'blue', '3v3': 'yellow' };

export default function MatchesPage() {
  const { gymId } = useGymLayout();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState<MatchFormat | ''>('');
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    setLoading(true);
    getMatches({
      gymId,
      format: formatFilter || undefined,
      days: daysFilter,
    }).then(data => {
      setMatches(data);
      setLoading(false);
    });
  }, [gymId, formatFilter, daysFilter]);

  const selectClass = 'bg-[#2C2C2E] text-white text-sm rounded-xl px-3 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Partidos</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
          Historial de partidos jugados en las canastas del club
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-[#636366]" />
        <select className={selectClass} value={formatFilter} onChange={e => setFormatFilter(e.target.value as MatchFormat | '')}>
          <option value="">Todas las modalidades</option>
          <option value="1v1">1 vs 1</option>
          <option value="2v2">2 vs 2</option>
          <option value="3v3">3 vs 3</option>
        </select>
        <select className={selectClass} value={daysFilter} onChange={e => setDaysFilter(Number(e.target.value))}>
          <option value={7}>Ultimos 7 dias</option>
          <option value={30}>Ultimos 30 dias</option>
          <option value={90}>Ultimos 90 dias</option>
          <option value={365}>Ultimo ano</option>
        </select>
        <span className="text-xs text-[#636366] ml-auto">{matches.length} partidos</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy size={40} className="text-[#3C3C3E] mb-3" />
          <p className="text-white font-medium">Sin partidos en este periodo</p>
          <p className="text-sm text-[#8E8E93] mt-1">Los partidos aparecen cuando se completan reservas en las canastas.</p>
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Fecha', 'Canasta', 'Modalidad', 'Resultado', 'Jugadores'].map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map(match => {
                const date = new Date(match.startedAt);
                return (
                  <tr key={match.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{date.toLocaleDateString('es', { day: 'numeric', month: 'short' })}</div>
                      <div className="text-xs text-[#636366]">{date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">{match.courtName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={FORMAT_COLOR[match.format]}>{FORMAT_LABEL[match.format]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{match.scoreA}</span>
                        <span className="text-xs text-[#636366]">—</span>
                        <span className="text-lg font-bold text-white">{match.scoreB}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {match.players && match.players.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-[#636366] flex-shrink-0" />
                          <span className="text-sm text-white">{match.players.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#636366]">{match.playerCount} jugador{match.playerCount !== 1 ? 'es' : ''}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
