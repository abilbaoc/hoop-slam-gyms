import { useEffect, useState } from 'react';
import { BookMarked, CalendarX, Trophy, Users } from 'lucide-react';
import KPICard from '../../components/kpi/KPICard';
import MatchesPerDayChart from './MatchesPerDayChart';
import { getReservations, getMatches, getClubMembers } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { Reservation, Match } from '../../types';

interface Stats {
  total_reservas: number;
  reservas_canceladas: number;
  partidos_jugados: number;
  jugadores: number;
}

export default function OverviewPage() {
  const { currentGym } = useGym();
  const [stats, setStats] = useState<Stats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const gymId = currentGym?.id;
    Promise.all([
      getReservations({ gymId }),
      getMatches({ gymId }),
      getClubMembers(gymId ?? ''),
    ]).then(([reservations, matchesData, members]) => {
      setMatches(matchesData);
      setStats({
        total_reservas: reservations.length,
        reservas_canceladas: reservations.filter((r: Reservation) => r.status === 'cancelled').length,
        partidos_jugados: matchesData.length,
        jugadores: members.length,
      });
    });
  }, [currentGym?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Dashboard</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">
          {currentGym ? currentGym.name : 'Vista general del club'}
        </p>
      </div>

      {/* KPIs — solo datos reales de Firebase */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Reservas"
          value={stats?.total_reservas ?? '-'}
          icon={<BookMarked size={20} />}
        />
        <KPICard
          title="Reservas Canceladas"
          value={stats?.reservas_canceladas ?? '-'}
          icon={<CalendarX size={20} />}
        />
        <KPICard
          title="Partidos Jugados"
          value={stats?.partidos_jugados ?? '-'}
          icon={<Trophy size={20} />}
        />
        <KPICard
          title="Jugadores Registrados"
          value={stats?.jugadores ?? '-'}
          icon={<Users size={20} />}
        />
      </div>

      {/* Gráfica de partidos por día — datos reales */}
      <MatchesPerDayChart matches={matches} />
    </div>
  );
}
