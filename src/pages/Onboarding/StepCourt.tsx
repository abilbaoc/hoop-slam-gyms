import { Input } from '../../components/ui/Input';
import type { OnboardingCourt } from '../../types/onboarding';

interface StepCourtProps {
  data: OnboardingCourt;
  onChange: (data: OnboardingCourt) => void;
  errors: Record<string, string>;
}

export default function StepCourt({ data, onChange, errors }: StepCourtProps) {
  const update = (field: keyof OnboardingCourt, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Primera canasta</h2>
        <p className="text-sm text-[#8E8E93]">Agrega tu primera canasta. Puedes anadir mas despues desde el panel.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nombre de la canasta *"
          placeholder="Ej: Canasta Norte"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Ubicacion (opcional)"
          placeholder="Ej: Pista principal, lado norte"
          value={data.location}
          onChange={(e) => update('location', e.target.value)}
        />
      </div>

      <p className="text-xs text-[#636366] bg-[#1C1C1E] rounded-xl px-4 py-3">
        Cada canasta tiene un sensor que registra partidos automaticamente. La configuracion del sensor se puede hacer despues.
      </p>
    </div>
  );
}
