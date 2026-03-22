import { Check, MapPin, Clock, Target } from 'lucide-react';
import type { OnboardingData } from '../../types/onboarding';

interface StepCompleteProps {
  data: OnboardingData;
}

export default function StepComplete({ data }: StepCompleteProps) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-[#7BFF00] rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-black" />
        </div>
        <h2 className="text-2xl font-bold text-white">Todo listo!</h2>
        <p className="text-sm text-[#8E8E93]">Tu gimnasio esta configurado y listo para usar</p>
      </div>

      <div className="bg-[#1C1C1E] rounded-2xl p-6 text-left space-y-4">
        <h3 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">Resumen</h3>

        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">{data.gym.name}</p>
            <p className="text-xs text-[#8E8E93]">{data.gym.address}, {data.gym.city}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock size={18} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white">L-V: {data.hours.weekdayOpen} - {data.hours.weekdayClose}</p>
            <p className="text-sm text-white">S-D: {data.hours.weekendOpen} - {data.hours.weekendClose}</p>
          </div>
        </div>

        {data.court.name && (
          <div className="flex items-start gap-3">
            <Target size={18} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-white">{data.court.name}</p>
              {data.court.location && <p className="text-xs text-[#8E8E93]">{data.court.location}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
