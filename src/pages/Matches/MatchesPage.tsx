import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import FormatBadge from '../../components/shared/FormatBadge';
import { useGym } from '../../contexts/GymContext';
import { getMatches, getCourts } from '../../data/api';
import type { Match, Court } from '../../types';
import { formatDateTime, formatDuration } from '../../utils/formatters';
import SyncStatusBadge from '../../components/shared/SyncStatusBadge';

export default function MatchesPage() {
  const { currentGym } = useGym();
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [courtFilter, setCourtFilter] = useState<string>('all');

  useEffect(() => {
    getMatches({ gymId: currentGym?.id }).then(setMatches);
    getCourts(currentGym?.id).then(setCourts);
  }, [currentGym?.id]);

  const courtMap = Object.fromEntries(courts.map((c) => [c.id, c.name]));

  const filtered = matches
    .filter((m) => formatFilter === 'all' || m.format === formatFilter)
    .filter((m) => courtFilter === 'all' || m.courtId === courtFilter)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Partidos</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">{filtered.length} partidos registrados</p>
      </div>

      {/* Sync status */}
      <div className="flex items-center gap-3">
        <SyncStatusBadge synced={matches.length > 0} />
        <span className="text-xs text-[#636366]">Ultima sincronizacion: hace unos segundos</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]"
        >
          <option value="all">Todos los formatos</option>
          <option value="1v1">1v1</option>
          <option value="2v2">2v2</option>
          <option value="3v3">3v3</option>
        </select>
        <select
          value={courtFilter}
          onChange={(e) => setCourtFilter(e.target.value)}
          className="bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]"
        >
          <option value="all">Todas las canchas</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Fecha', 'Canasta', 'Formato', 'Resultado', 'Duracion'].map((h) => (
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
              {filtered.slice(0, 50).map((match) => (
                <tr
                  key={match.id}
                  className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/50 transition-colors"
                >
                  <td className="px-6 py-3 text-sm text-white whitespace-nowrap">
                    {formatDateTime(match.startedAt)}
                  </td>
                  <td className="px-6 py-3 text-sm text-[#8E8E93]">
                    {courtMap[match.courtId] || match.courtId}
                  </td>
                  <td className="px-6 py-3">
                    <FormatBadge format={match.format} />
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm font-semibold text-white">
                      {match.scoreA}
                    </span>
                    <span className="text-sm text-[#636366] mx-2">-</span>
                    <span className="text-sm font-semibold text-white">
                      {match.scoreB}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#8E8E93]">
                    {formatDuration(match.duration)}
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
