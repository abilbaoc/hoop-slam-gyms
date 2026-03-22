import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reservation, Court } from '../../types';
import Card from '../../components/ui/Card';

interface ReservationCalendarProps {
  reservations: Reservation[];
  courts: Court[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Generate 28 half-hour slots from 08:00 to 21:30
const TIME_SLOTS: string[] = [];
for (let h = 8; h < 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-[#7BFF00]/20 border border-[#7BFF00]/30',
  cancelled: 'bg-[#FF453A]/20 border border-[#FF453A]/30',
  blocked: 'bg-[#FF9F0A]/20 border border-[#FF9F0A]/30',
};

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function slotInRange(slot: string, start: string, end: string): boolean {
  return slot >= start && slot < end;
}

export default function ReservationCalendar({
  reservations,
  courts,
  selectedDate,
  onDateChange,
}: ReservationCalendarProps) {
  const dayReservations = useMemo(
    () => reservations.filter((r) => r.date === selectedDate),
    [reservations, selectedDate]
  );

  const getReservation = (courtId: string, slot: string): Reservation | undefined => {
    return dayReservations.find(
      (r) => r.courtId === courtId && slotInRange(slot, r.startTime, r.endTime)
    );
  };

  return (
    <Card className="!p-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2C2C2E]">
        <button
          onClick={() => onDateChange(shiftDate(selectedDate, -1))}
          className="text-[#8E8E93] hover:text-white transition-colors p-1"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-white">
          {formatDateDisplay(selectedDate)}
        </span>
        <button
          onClick={() => onDateChange(shiftDate(selectedDate, 1))}
          className="text-[#8E8E93] hover:text-white transition-colors p-1"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto p-4">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `144px repeat(${TIME_SLOTS.length}, minmax(40px, 1fr))`,
          }}
        >
          {/* Header row: empty corner + time labels */}
          <div />
          {TIME_SLOTS.map((slot, i) => (
            <div key={slot} className="text-center py-1">
              {i % 2 === 0 && (
                <span className="text-[10px] text-[#636366]">{slot.slice(0, 2)}</span>
              )}
            </div>
          ))}

          {/* Court rows */}
          {courts.map((court) => (
            <>
              <div
                key={`label-${court.id}`}
                className="flex items-center pr-3 text-sm text-white font-medium truncate h-10"
              >
                {court.name}
              </div>
              {TIME_SLOTS.map((slot) => {
                const res = getReservation(court.id, slot);
                return (
                  <div
                    key={`${court.id}-${slot}`}
                    className={`min-w-[40px] h-10 ${
                      res ? STATUS_STYLES[res.status] : 'bg-transparent'
                    }`}
                    title={
                      res
                        ? `${res.playerName} | ${res.startTime}-${res.endTime} | ${res.format} | ${res.status}`
                        : undefined
                    }
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </Card>
  );
}
