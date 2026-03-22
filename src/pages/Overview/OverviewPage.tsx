import { useEffect, useState } from 'react';
import { Activity, Users, Percent, Trophy, Euro } from 'lucide-react';
import KPICard from '../../components/kpi/KPICard';
import MatchesPerDayChart from './MatchesPerDayChart';
import PeakHoursHeatmap from './PeakHoursHeatmap';
import FormatDistribution from './FormatDistribution';
import OccupancyByCourtChart from './OccupancyByCourtChart';
import RecentActivity from './RecentActivity';
import LiveActivityPanel from './LiveActivityPanel';
import type { KPIData } from '../../types';
import { getKPIs } from '../../data/api';
import { useGym } from '../../contexts/GymContext';

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const { currentGym } = useGym();

  useEffect(() => {
    getKPIs(currentGym?.id).then(setKpis);
  }, [currentGym?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Dashboard</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">
          {currentGym ? currentGym.name : 'Vista general de tus canchas'}
        </p>
      </div>

      {/* Live Activity */}
      <LiveActivityPanel />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Partidos Hoy"
          value={kpis?.matchesToday ?? '-'}
          trend={kpis?.matchesTodayTrend}
          icon={<Activity size={20} />}
        />
        <KPICard
          title="Jugadores Activos"
          value={kpis?.activePlayers ?? '-'}
          trend={kpis?.activePlayersTrend}
          icon={<Users size={20} />}
        />
        <KPICard
          title="Ocupacion Media"
          value={kpis ? `${Math.round(kpis.avgOccupancy)}%` : '-'}
          trend={kpis?.avgOccupancyTrend}
          icon={<Percent size={20} />}
        />
        <KPICard
          title="Ingresos Hoy"
          value={kpis ? `${kpis.revenueToday} EUR` : '-'}
          trend={kpis?.revenueTodayTrend}
          icon={<Euro size={20} />}
        />
        <KPICard
          title="Partidos Semana"
          value={kpis?.totalMatchesWeek ?? '-'}
          icon={<Trophy size={20} />}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MatchesPerDayChart />
        <PeakHoursHeatmap />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FormatDistribution />
        <OccupancyByCourtChart />
      </div>

      {/* Recent activity */}
      <RecentActivity />
    </div>
  );
}
