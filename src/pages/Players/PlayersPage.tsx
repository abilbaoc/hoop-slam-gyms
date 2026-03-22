import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import FormatBadge from '../../components/shared/FormatBadge';
import { useGym } from '../../contexts/GymContext';
import { getPlayers } from '../../data/api';
import type { Player } from '../../types';
import { formatDate, formatELO } from '../../utils/formatters';

const recurrenceVariant: Record<string, 'green' | 'blue' | 'yellow' | 'gray'> = {
  diario: 'green',
  semanal: 'blue',
  mensual: 'yellow',
  inactivo: 'gray',
};

export default function PlayersPage() {
  const { currentGym } = useGym();
  const [players, setPlayers] = useState<Player[]>([]);
  const [sortBy, setSortBy] = useState<'elo' | 'matches' | 'name'>('elo');

  useEffect(() => {
    getPlayers(currentGym?.id).then(setPlayers);
  }, [currentGym?.id]);

  const sorted = [...players].sort((a, b) => {
    if (sortBy === 'elo') return b.elo - a.elo;
    if (sortBy === 'matches') return b.matchesPlayed - a.matchesPlayed;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Jugadores</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">{players.length} jugadores registrados</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-[#636366] mb-1">Activos (diario)</p>
          <p className="font-display text-3xl text-[#7BFF00] leading-none">
            {players.filter((p) => p.recurrence === 'diario').length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[#636366] mb-1">Semanales</p>
          <p className="font-display text-3xl text-white leading-none">
            {players.filter((p) => p.recurrence === 'semanal').length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[#636366] mb-1">Mensuales</p>
          <p className="font-display text-3xl text-white leading-none">
            {players.filter((p) => p.recurrence === 'mensual').length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-[#636366] mb-1">Inactivos</p>
          <p className="font-display text-3xl text-[#FF453A] leading-none">
            {players.filter((p) => p.recurrence === 'inactivo').length}
          </p>
        </Card>
      </div>

      {/* Sort */}
      <div className="flex gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]"
        >
          <option value="elo">Ordenar por Rating</option>
          <option value="matches">Ordenar por partidos</option>
          <option value="name">Ordenar por nombre</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Jugador', 'Rating', 'Nivel', 'Partidos', 'V/D', 'Formato', 'Recurrencia', 'Ultima partida'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wider px-6 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#7BFF00]">{player.initials}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-display text-xl text-[#7BFF00] leading-none">{formatELO(player.elo)}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#8E8E93]">{player.level}</td>
                  <td className="px-6 py-3 text-sm text-white">{player.matchesPlayed}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className="text-[#34C759]">{player.wins}</span>
                    <span className="text-[#636366]">/</span>
                    <span className="text-[#FF453A]">{player.losses}</span>
                  </td>
                  <td className="px-6 py-3">
                    <FormatBadge format={player.preferredFormat} />
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={recurrenceVariant[player.recurrence] || 'gray'}>
                      {player.recurrence}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#8E8E93] whitespace-nowrap">
                    {formatDate(player.lastPlayedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
