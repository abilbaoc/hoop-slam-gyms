import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import Card from '../../components/ui/Card';
import { useGym } from '../../contexts/GymContext';
import { getFormatDistributionData } from '../../data/api';
import type { FormatDistribution as FormatDist } from '../../types';
import { chartColors } from '../../theme/tokens';

const FORMAT_COLORS: Record<string, string> = {
  '1v1': chartColors[0],
  '2v2': chartColors[1],
  '3v3': chartColors[3],
};

export default function FormatDistribution() {
  const { currentGym } = useGym();
  const [data, setData] = useState<FormatDist[]>([]);

  useEffect(() => {
    getFormatDistributionData(currentGym?.id).then(setData);
  }, [currentGym?.id]);

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-1">Formatos</h3>
      <p className="text-xs text-[#8E8E93] mb-4">Distribucion por tipo de partido</p>
      <div className="flex items-center gap-6">
        <div className="h-[200px] w-[200px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="format"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.format}
                    fill={FORMAT_COLORS[entry.format] || chartColors[2]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1E',
                  border: '1px solid #2C2C2E',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.format} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: FORMAT_COLORS[item.format] || chartColors[2] }}
              />
              <div>
                <p className="text-sm font-medium text-white">{item.format}</p>
                <p className="text-xs text-[#8E8E93]">
                  {item.count} partidos ({Math.round(item.percentage)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
