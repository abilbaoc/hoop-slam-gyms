import { useState, useMemo } from 'react';
import type { PricingRule } from '../../types';
import Card from '../../components/ui/Card';

interface PriceTimelineProps {
  rules: PricingRule[];
}

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8..22

const TYPE_COLORS: Record<string, string> = {
  base: 'bg-[#00D4FF]/30',
  peak: 'bg-[#FF6B6B]/30',
  offpeak: 'bg-[#7BFF00]/30',
  weekend: 'bg-[#FFD93D]/30',
};

export default function PriceTimeline({ rules }: PriceTimelineProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  const hourPrices = useMemo(() => {
    const isWeekend = selectedDay >= 5;
    const baseRule = rules.find((r) => r.type === 'base');
    const weekendRule = rules.find((r) => r.type === 'weekend');
    const peakRule = rules.find((r) => r.type === 'peak');
    const offpeakRule = rules.find((r) => r.type === 'offpeak');

    return HOURS.map((hour) => {
      if (isWeekend && weekendRule) {
        return { price: weekendRule.priceEur, type: 'weekend' };
      }

      if (
        peakRule &&
        peakRule.startHour !== undefined &&
        peakRule.endHour !== undefined &&
        hour >= peakRule.startHour &&
        hour < peakRule.endHour
      ) {
        return { price: peakRule.priceEur, type: 'peak' };
      }

      if (
        offpeakRule &&
        offpeakRule.startHour !== undefined &&
        offpeakRule.endHour !== undefined &&
        hour >= offpeakRule.startHour &&
        hour < offpeakRule.endHour
      ) {
        return { price: offpeakRule.priceEur, type: 'offpeak' };
      }

      return { price: baseRule?.priceEur ?? 0, type: 'base' };
    });
  }, [rules, selectedDay]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Vista previa de precios</h3>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setSelectedDay(i)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedDay === i
                  ? 'bg-[#7BFF00] text-black'
                  : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="flex h-12 rounded-xl overflow-hidden">
        {hourPrices.map((hp, i) => (
          <div
            key={i}
            className={`flex-1 flex items-center justify-center ${TYPE_COLORS[hp.type]}`}
          >
            {i % 2 === 0 && (
              <span className="text-[10px] font-bold text-white">
                {hp.price}&euro;
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Hour labels */}
      <div className="flex mt-1">
        {HOURS.map((hour) => (
          <div key={hour} className="flex-1 text-center">
            <span className="text-[10px] text-[#636366]">
              {hour.toString().padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
