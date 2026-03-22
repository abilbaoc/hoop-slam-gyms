import { useEffect, useState } from 'react';
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
import { useGym } from '../../contexts/GymContext';
import { getDailyMatchesData } from '../../data/api';
import type { DailyMatches } from '../../types';
import { chartColors } from '../../theme/tokens';

export default function MatchesPerDayChart() {
  const { currentGym } = useGym();
  const [data, setData] = useState<DailyMatches[]>([]);

  useEffect(() => {
    getDailyMatchesData(30, currentGym?.id).then(setData);
  }, [currentGym?.id]);

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-1">Partidos por dia</h3>
      <p className="text-xs text-[#8E8E93] mb-4">Ultimos 30 dias</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="matchesGradient" x1="0" y1="0" x2="0" y2="1">
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
            <YAxis
              stroke="#636366"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1C1C1E',
                border: '1px solid #2C2C2E',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
              }}
              labelFormatter={(v) => {
                const d = new Date(v);
                return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
              }}
              formatter={(value) => [value, 'Partidos']}
            />
            <Area
              type="monotone"
              dataKey="matches"
              stroke={chartColors[0]}
              strokeWidth={2}
              fill="url(#matchesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
