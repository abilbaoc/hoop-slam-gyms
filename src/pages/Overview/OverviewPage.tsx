import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarX, PlayCircle, XCircle, BookMarked } from 'lucide-react';
import KPICard from '../../components/kpi/KPICard';
import MatchesPerDayChart from './MatchesPerDayChart';
import { getReservations, getMatches } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { Reservation } from '../../types';
import type { Match } from '../../types';

interface Stats {
  reservas_hechas: number;
  reservas_iniciadas: number;
  reservas_canceladas: number;
  partidos_jugados: number;
  partidos_cancelados: number;
}

function computeStats(reservations: Reservation[], matches: Match[]): Stats {
  const now = new Date();
  const reservas_hechas = reservations.filter((r) => r.status === 'confirmed').length;
  const reservas_iniciadas = reservations.filter((r) => {
    if (r.status !== 'confirmed') return false;
    const start = new Date(`${r.date}T${r.startTime}`);
    return start <= now;
  }).length;
  const reservas_canceladas = reservations.filter((r) => r.status === 'cancelled').length;
  // All matches in the system are played; cancelled matches would have status 'cancelled' once backend adds it
  const partidos_jugados = matches.length;
  const partidos_cancelados = 0;
  return { reservas_hechas, reservas_iniciadas, reservas_canceladas, partidos_jugados, partidos_cancelados };
}

export default function OverviewPage() {
  const { currentGym } = useGym();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      getReservations({ gymId: currentGym?.id }),
      getMatches({ gymId: currentGym?.id }),
    ]).then(([reservations, matches]) => {
      setStats(computeStats(reservations, matches));
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

      {/* 5 KPIs permitidos */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Reservas Hechas"
          value={stats?.reservas_hechas ?? '-'}
          icon={<BookMarked size={20} />}
        />
        <KPICard
          title="Reservas Iniciadas"
          value={stats?.reservas_iniciadas ?? '-'}
          icon={<CalendarCheck size={20} />}
        />
        <KPICard
          title="Reservas Canceladas"
          value={stats?.reservas_canceladas ?? '-'}
          icon={<CalendarX size={20} />}
        />
        <KPICard
          title="Partidos Jugados"
          value={stats?.partidos_jugados ?? '-'}
          icon={<PlayCircle size={20} />}
        />
        <KPICard
          title="Partidos Cancelados"
          value={stats?.partidos_cancelados ?? '-'}
          icon={<XCircle size={20} />}
        />
      </div>

      {/* Gráfica de partidos por día */}
      <MatchesPerDayChart />
    </div>
  );
}
