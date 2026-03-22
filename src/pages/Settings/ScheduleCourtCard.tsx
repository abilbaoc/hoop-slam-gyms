import type { Court } from '../../types/court';
import type { CourtSchedule, ScheduleException } from '../../types/config';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import CourtStatusBadge from '../../components/shared/CourtStatusBadge';

interface ScheduleCourtCardProps {
  court: Court;
  schedule: CourtSchedule;
  exceptions: ScheduleException[];
  onScheduleChange: (schedule: CourtSchedule) => void;
  onAddException: () => void;
  onRemoveException: (id: string) => void;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#7BFF00]' : 'bg-[#636366]'
      }`}
    >
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#2C2C2E] text-white rounded-lg border border-[#2C2C2E] px-2 py-1.5 text-sm w-24 outline-none focus:border-[#7BFF00] transition-colors"
    />
  );
}

export default function ScheduleCourtCard({
  court,
  schedule,
  exceptions,
  onScheduleChange,
  onAddException,
  onRemoveException,
}: ScheduleCourtCardProps) {
  const handleToggle = (isOpen: boolean) => {
    onScheduleChange({ ...schedule, isOpen });
  };

  const handleTimeChange = (
    field: 'weekdayOpen' | 'weekdayClose' | 'weekendOpen' | 'weekendClose',
    value: string,
  ) => {
    onScheduleChange({ ...schedule, [field]: value });
  };

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">{court.name}</span>
          <CourtStatusBadge status={court.status} />
        </div>
        <ToggleSwitch checked={schedule.isOpen} onChange={handleToggle} />
      </div>

      {/* Body - Time Rows */}
      <div
        className={`flex flex-col gap-3 transition-opacity ${
          !schedule.isOpen ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* Weekday row */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#8E8E93] w-8">L-V</span>
          <TimeInput
            value={schedule.weekdayOpen}
            onChange={(v) => handleTimeChange('weekdayOpen', v)}
          />
          <span className="text-xs text-[#636366]">a</span>
          <TimeInput
            value={schedule.weekdayClose}
            onChange={(v) => handleTimeChange('weekdayClose', v)}
          />
        </div>

        {/* Weekend row */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#8E8E93] w-8">S-D</span>
          <TimeInput
            value={schedule.weekendOpen}
            onChange={(v) => handleTimeChange('weekendOpen', v)}
          />
          <span className="text-xs text-[#636366]">a</span>
          <TimeInput
            value={schedule.weekendClose}
            onChange={(v) => handleTimeChange('weekendClose', v)}
          />
        </div>
      </div>

      {/* Footer - Exceptions */}
      <div className="border-t border-[#2C2C2E] pt-3 flex flex-col gap-2">
        {exceptions.map((exc) => (
          <div key={exc.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8E8E93]">{exc.date}</span>
              <span className="text-xs text-white">{exc.reason}</span>
              <Badge variant={exc.isClosed ? 'red' : 'yellow'} size="sm">
                {exc.isClosed ? 'Cerrado' : 'Horario especial'}
              </Badge>
            </div>
            <button
              onClick={() => onRemoveException(exc.id)}
              className="text-[#636366] hover:text-[#FF453A] transition-colors p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        <button
          onClick={onAddException}
          className="flex items-center gap-1 text-xs text-[#7BFF00] hover:underline cursor-pointer w-fit mt-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Anadir excepcion
        </button>
      </div>
    </Card>
  );
}
