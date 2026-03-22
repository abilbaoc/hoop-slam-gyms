import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '../../components/ui/Card';
import { useGym } from '../../contexts/GymContext';
import { getCourtOccupancyData } from '../../data/api';
import type { CourtOccupancy } from '../../types';
import { chartColors } from '../../theme/tokens';

export default function OccupancyByCourtChart() {
  const { currentGym } = useGym();
  const [data, setData] = useState<CourtOccupancy[]>([]);

  useEffect(() => {
    getCourtOccupancyData(currentGym?.id).then(setData);
  }, [currentGym?.id]);

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-1">Ocupacion por canasta</h3>
      <p className="text-xs text-[#8E8E93] mb-4">Porcentaje medio de uso</p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" horizontal={false} />
            <XAxis
              type="number"
              stroke="#636366"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="courtName"
              stroke="#636366"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={120}
              tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '...' : v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1C1C1E',
                border: '1px solid #2C2C2E',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
              }}
              formatter={(value) => [`${Math.round(Number(value))}%`, 'Ocupacion']}
            />
            <Bar
              dataKey="occupancy"
              fill={chartColors[0]}
              radius={[0, 6, 6, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
