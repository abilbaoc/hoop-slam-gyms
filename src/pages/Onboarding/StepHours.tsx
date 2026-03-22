import type { OnboardingHours } from '../../types/onboarding';

interface StepHoursProps {
  data: OnboardingHours;
  onChange: (data: OnboardingHours) => void;
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#8E8E93]">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#2C2C2E] text-white rounded-xl border border-[#3C3C3E] px-4 py-2.5 text-sm outline-none hover:bg-[#3C3C3E] transition-colors focus:ring-1 focus:ring-[#7BFF00]/40 focus:border-[#7BFF00]/40"
      />
    </div>
  );
}

export default function StepHours({ data, onChange }: StepHoursProps) {
  const update = (field: keyof OnboardingHours, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Horarios de apertura</h2>
        <p className="text-sm text-[#8E8E93]">Configura los horarios generales. Puedes ajustarlos despues.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Lunes a Viernes</h3>
          <div className="grid grid-cols-2 gap-4">
            <TimeInput label="Apertura" value={data.weekdayOpen} onChange={(v) => update('weekdayOpen', v)} />
            <TimeInput label="Cierre" value={data.weekdayClose} onChange={(v) => update('weekdayClose', v)} />
          </div>
        </div>

        <div className="border-t border-[#2C2C2E]" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Fines de semana</h3>
          <div className="grid grid-cols-2 gap-4">
            <TimeInput label="Apertura" value={data.weekendOpen} onChange={(v) => update('weekendOpen', v)} />
            <TimeInput label="Cierre" value={data.weekendClose} onChange={(v) => update('weekendClose', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
