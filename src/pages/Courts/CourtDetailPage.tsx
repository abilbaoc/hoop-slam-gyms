import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../../components/ui/Card';
import CourtStatusBadge from '../../components/shared/CourtStatusBadge';
import { getCourts, getMatches, getDailyMatchesData } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { Court, Match, DailyMatches } from '../../types';
import { chartColors } from '../../theme/tokens';
import { formatDate } from '../../utils/formatters';

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentGym } = useGym();
  const [court, setCourt] = useState<Court | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [dailyData, setDailyData] = useState<DailyMatches[]>([]);

  useEffect(() => {
    getCourts().then((courts) => {
      const found = courts.find((c) => c.id === id);
      if (found) setCourt(found);
    });
    getMatches({ courtId: id }).then(setMatches);
    getDailyMatchesData(30).then(setDailyData);
  }, [id]);

  if (!court) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8E8E93]">Cargando...</p>
      </div>
    );
  }

  const courtMatches = matches.filter((m) => m.courtId === id);
  const totalMatches = courtMatches.length;
  const avgDuration = totalMatches > 0
    ? Math.round(courtMatches.reduce((a, m) => a + m.duration, 0) / totalMatches)
    : 0;
  const formatCounts = courtMatches.reduce((acc, m) => {
    acc[m.format] = (acc[m.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/gym/${currentGym?.id}/courts`)}
        className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Volver a canchas</span>
      </button>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#7BFF00]/10 flex items-center justify-center">
          <MapPin size={24} className="text-[#7BFF00]" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{court.name}</h1>
            <CourtStatusBadge status={court.status} />
          </div>
          <p className="text-sm text-[#8E8E93]">
            {court.location} · Instalada {formatDate(court.installedDate)}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total partidos', value: totalMatches },
          { label: 'Duracion media', value: `${avgDuration} min` },
          { label: 'Formato popular', value: topFormat },
          { label: 'Estado', value: court.status === 'online' ? 'Activa' : court.status === 'maintenance' ? 'Mant.' : 'Inactiva' },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-[#636366] mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <h3 className="text-base font-semibold text-white mb-1">Actividad diaria</h3>
        <p className="text-xs text-[#8E8E93] mb-4">Partidos en esta canasta, ultimos 30 dias</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="courtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#636366"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#636366" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1E',
                  border: '1px solid #2C2C2E',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="matches"
                stroke={chartColors[0]}
                strokeWidth={2}
                fill="url(#courtGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
