import type { Court } from '../../types/court';
import type { CourtSchedule } from '../../types/config';
import Card from '../../components/ui/Card';

interface ScheduleWeeklyViewProps {
  schedules: CourtSchedule[];
  courts: Court[];
  selectedCourtId: string;
  onCourtChange: (id: string) => void;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const HOUR_START = 8;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_LABELS = Array.from({ length: 8 }, (_, i) => HOUR_START + i * 2);
const BAR_HEIGHT = 280;

function timeToHour(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

export default function ScheduleWeeklyView({
  schedules,
  courts,
  selectedCourtId,
  onCourtChange,
}: ScheduleWeeklyViewProps) {
  const schedule = schedules.find((s) => s.courtId === selectedCourtId);

  const getSegment = (dayIndex: number) => {
    if (!schedule || !schedule.isOpen) return { top: 0, height: 0 };

    const isWeekend = dayIndex >= 5;
    const open = timeToHour(isWeekend ? schedule.weekendOpen : schedule.weekdayOpen);
    const close = timeToHour(isWeekend ? schedule.weekendClose : schedule.weekdayClose);

    const topOffset = ((open - HOUR_START) / TOTAL_HOURS) * BAR_HEIGHT;
    const segmentHeight = ((close - open) / TOTAL_HOURS) * BAR_HEIGHT;

    return { top: topOffset, height: segmentHeight };
  };

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Vista semanal</h3>
        <select
          value={selectedCourtId}
          onChange={(e) => onCourtChange(e.target.value)}
          className="bg-[#2C2C2E] text-white rounded-xl border border-[#2C2C2E] px-3 py-2 text-sm outline-none focus:border-[#7BFF00] transition-colors"
        >
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly grid */}
      <div className="flex gap-1">
        {/* Hour labels */}
        <div
          className="flex flex-col justify-between pr-2 flex-shrink-0"
          style={{ height: BAR_HEIGHT }}
        >
          {HOUR_LABELS.map((hour) => (
            <span
              key={hour}
              className="text-[10px] text-[#636366] leading-none"
            >
              {String(hour).padStart(2, '0')}
            </span>
          ))}
        </div>

        {/* Day columns */}
        {DAY_LABELS.map((day, dayIndex) => {
          const segment = getSegment(dayIndex);

          return (
            <div key={day} className="flex flex-col items-center flex-1 gap-2">
              {/* Bar */}
              <div
                className="relative w-full rounded-lg bg-[#2C2C2E] overflow-hidden"
                style={{ height: BAR_HEIGHT }}
              >
                {schedule?.isOpen && segment.height > 0 && (
                  <div
                    className="absolute left-0 right-0 bg-[#7BFF00]/20 border-l-2 border-[#7BFF00]"
                    style={{
                      top: segment.top,
                      height: segment.height,
                    }}
                  />
                )}
              </div>
              {/* Day label */}
              <span className="text-[11px] text-[#8E8E93] font-medium">
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
