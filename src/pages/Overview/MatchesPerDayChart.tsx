import { useMemo } from 'react';
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
import type { Match } from '../../types';
import { chartColors } from '../../theme/tokens';

interface Props {
  matches: Match[];
  days?: number;
}

export default function MatchesPerDayChart({ matches, days = 30 }: Props) {
  const data = useMemo(() => {
    const result: { date: string; partidos: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = matches.filter(m => m.startedAt.slice(0, 10) === dateStr).length;
      result.push({ date: dateStr, partidos: count });
    }
    return result;
  }, [matches, days]);

  const hasData = matches.length > 0;

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-1">Partidos por dia</h3>
      <p className="text-xs text-[#8E8E93] mb-4">Ultimos {days} dias</p>
      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-[#636366] text-sm">
          Sin partidos en este periodo
        </div>
      ) : (
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
                allowDecimals={false}
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
                dataKey="partidos"
                stroke={chartColors[0]}
                strokeWidth={2}
                fill="url(#matchesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
