import { useState, useEffect, useMemo } from 'react';
import { Filter, Trophy, Users } from 'lucide-react';
import { getReservations, getMatches, getCourts } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { Reservation, Match, Court } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';

type TabId = 'all' | 'played' | 'cancelled';

const tabs = [
  { id: 'all', label: 'Todas' },
  { id: 'played', label: 'Jugados' },
  { id: 'cancelled', label: 'Cancelados' },
];

const FORMAT_LABEL: Record<string, string> = { '1v1': '1 vs 1', '2v2': '2 vs 2', '3v3': '3 vs 3' };

export default function ReservationsPage() {
  const { currentGym } = useGym();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [loading, setLoading] = useState(true);
  const [filterCourtId, setFilterCourtId] = useState('');

  useEffect(() => {
    setLoading(true);
    const gymId = currentGym?.id;
    Promise.all([
      getReservations({ gymId }),
      getMatches({ gymId }),
      getCourts(gymId),
    ]).then(([res, mat, cts]) => {
      setReservations(res);
      setMatches(mat);
      setCourts(cts);
      setLoading(false);
    });
  }, [currentGym?.id]);

  const myCourtIds = useMemo(() => new Set(courts.map(c => c.id)), [courts]);
  const courtMap = useMemo(() => new Map(courts.map(c => [c.id, c.name])), [courts]);

  // Match lookup by reservation-related data
  const matchByReservationDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    matches.forEach(m => {
      const key = m.courtId + '|' + m.startedAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [matches]);

  const filtered = useMemo(() => {
    let result = reservations.filter(r => myCourtIds.has(r.courtId));
    if (filterCourtId) result = result.filter(r => r.courtId === filterCourtId);
    if (activeTab === 'played') result = result.filter(r => r.status === 'confirmed');
    if (activeTab === 'cancelled') result = result.filter(r => r.status === 'cancelled');
    return result;
  }, [reservations, activeTab, filterCourtId, myCourtIds]);

  const confirmedCount = reservations.filter(r => myCourtIds.has(r.courtId) && r.status === 'confirmed').length;
  const cancelledCount = reservations.filter(r => myCourtIds.has(r.courtId) && r.status === 'cancelled').length;

  const selectClass = 'bg-[#2C2C2E] text-white text-sm rounded-xl px-3 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Reservas</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
          Historial de reservas y partidos en tus cestas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-[#636366]">Total</p>
          <p className="text-xl font-bold text-white">{confirmedCount + cancelledCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#636366]">Jugados</p>
          <p className="text-xl font-bold text-[#7BFF00]">{confirmedCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#636366]">Cancelados</p>
          <p className="text-xl font-bold text-[#FF453A]">{cancelledCount}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-[#636366]" />
        <select className={selectClass} value={filterCourtId} onChange={e => setFilterCourtId(e.target.value)}>
          <option value="">Todas las cestas</option>
          {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-[#636366] ml-auto">{filtered.length} resultados</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy size={40} className="text-[#3C3C3E] mb-3" />
          <p className="text-white font-medium">Sin resultados</p>
        </div>
      ) : (
        <Card className="!p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Fecha', 'Hora', 'Cesta', 'Jugador', 'Estado', activeTab === 'played' ? 'Resultado' : ''].filter(Boolean).map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(res => {
                const courtName = courtMap.get(res.courtId) ?? res.courtId;
                // Find matching games for this reservation
                const key = res.courtId + '|' + res.date;
                const relatedMatches = matchByReservationDate.get(key) ?? [];

                return (
                  <tr key={res.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{new Date(res.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{res.startTime} – {res.endTime}</td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">{courtName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#636366] flex-shrink-0" />
                        <span className="text-sm text-white">{res.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {res.status === 'confirmed' ? (
                        <Badge variant="green">Completada</Badge>
                      ) : (
                        <Badge variant="red">Cancelada</Badge>
                      )}
                    </td>
                    {activeTab === 'played' && (
                      <td className="px-4 py-3">
                        {relatedMatches.length > 0 ? (
                          <div className="space-y-1">
                            {relatedMatches.map(m => (
                              <div key={m.id} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{m.scoreA} – {m.scoreB}</span>
                                <span className="text-[10px] text-[#636366]">{FORMAT_LABEL[m.format] ?? m.format}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#636366]">Sin score</span>
                        )}
                      </td>
                    )}
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
