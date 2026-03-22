import { Input } from '../../components/ui/Input';
import type { OnboardingGym } from '../../types/onboarding';

interface StepGymInfoProps {
  data: OnboardingGym;
  onChange: (data: OnboardingGym) => void;
  errors: Record<string, string>;
}

export default function StepGymInfo({ data, onChange, errors }: StepGymInfoProps) {
  const update = (field: keyof OnboardingGym, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Datos del gimnasio</h2>
        <p className="text-sm text-[#8E8E93]">Informacion basica de tu instalacion deportiva</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nombre del gimnasio *"
          placeholder="Ej: Polideportivo Municipal"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Direccion *"
          placeholder="Ej: Carrer de la Marina, 45"
          value={data.address}
          onChange={(e) => update('address', e.target.value)}
          error={errors.address}
        />
        <Input
          label="Ciudad *"
          placeholder="Ej: Barcelona"
          value={data.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefono"
            placeholder="+34 93 123 4567"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="info@tugimnasio.es"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
