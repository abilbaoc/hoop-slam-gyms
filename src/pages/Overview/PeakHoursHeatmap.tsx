import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { useGym } from '../../contexts/GymContext';
import { getHourlyHeatmapData } from '../../data/api';
import type { HourlyHeatmap } from '../../types';
import { heatmapScale } from '../../theme/tokens';
import { getDayName, getHourLabel } from '../../utils/formatters';

function getColor(value: number, max: number): string {
  if (max === 0) return heatmapScale[0];
  const ratio = value / max;
  if (ratio === 0) return heatmapScale[0];
  if (ratio < 0.25) return heatmapScale[1];
  if (ratio < 0.5) return heatmapScale[2];
  if (ratio < 0.75) return heatmapScale[3];
  return heatmapScale[4];
}

export default function PeakHoursHeatmap() {
  const { currentGym } = useGym();
  const [data, setData] = useState<HourlyHeatmap[]>([]);

  useEffect(() => {
    getHourlyHeatmapData(currentGym?.id).then(setData);
  }, [currentGym?.id]);

  const max = Math.max(...data.map((d) => d.value), 1);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00
  const days = Array.from({ length: 7 }, (_, i) => i);

  const getValue = (day: number, hour: number) => {
    return data.find((d) => d.day === day && d.hour === hour)?.value ?? 0;
  };

  return (
    <Card>
      <h3 className="text-base font-semibold text-white mb-1">Horas pico</h3>
      <p className="text-xs text-[#8E8E93] mb-4">Distribucion semanal de partidos</p>
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hour labels */}
          <div className="flex gap-[3px] mb-1 ml-10">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-[10px] text-[#636366] text-center">
                {h % 2 === 0 ? getHourLabel(h) : ''}
              </div>
            ))}
          </div>
          {/* Grid */}
          {days.map((day) => (
            <div key={day} className="flex items-center gap-[3px] mb-[3px]">
              <span className="w-10 text-[11px] text-[#8E8E93] text-right pr-2 flex-shrink-0">
                {getDayName(day)}
              </span>
              {hours.map((hour) => {
                const v = getValue(day, hour);
                return (
                  <div
                    key={hour}
                    className="flex-1 aspect-square rounded-[3px] transition-colors cursor-default"
                    style={{ backgroundColor: getColor(v, max) }}
                    title={`${getDayName(day)} ${getHourLabel(hour)}: ${v} partidos`}
                  />
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-[10px] text-[#636366] mr-1">Menos</span>
            {heatmapScale.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="text-[10px] text-[#636366] ml-1">Mas</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
