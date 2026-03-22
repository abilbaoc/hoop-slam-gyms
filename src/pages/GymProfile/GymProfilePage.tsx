import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Edit2, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { Gym } from '../../types/gym';
import { getGymById } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function GymProfilePage() {
  const { currentGym } = useGym();
  const { canEditGymProfile } = usePermissions();
  const [gym, setGym] = useState<Gym | null>(null);

  useEffect(() => {
    if (currentGym) {
      getGymById(currentGym.id).then((g) => {
        if (g) setGym(g);
      });
    }
  }, [currentGym]);

  if (!gym) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8E8E93]">Cargando perfil...</p>
      </div>
    );
  }

  const initials = gym.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleEdit = () => {
    toast.success('Guardado');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#7BFF00] flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-xl">{initials}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{gym.name}</h1>
          <p className="text-sm text-[#8E8E93]">{gym.city}</p>
        </div>
        {canEditGymProfile && (
          <Button variant="secondary" size="sm" onClick={handleEdit}>
            <Edit2 size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Informacion del gimnasio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#636366]">Direccion</p>
              <p className="text-sm text-white">{gym.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#636366]">Ciudad</p>
              <p className="text-sm text-white">{gym.city}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#636366]">Telefono</p>
              <p className="text-sm text-white">{gym.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#636366]">Email</p>
              <p className="text-sm text-white">{gym.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Opening Hours Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#7BFF00]" />
          <h2 className="text-lg font-semibold text-white">Horario de apertura</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#636366] text-xs border-b border-[#2C2C2E]">
                <th className="text-left py-2 font-medium">Periodo</th>
                <th className="text-left py-2 font-medium">Apertura</th>
                <th className="text-left py-2 font-medium">Cierre</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#2C2C2E]">
                <td className="py-3 text-white">Lunes a Viernes</td>
                <td className="py-3 text-[#8E8E93]">{gym.openingHours.weekdayOpen}</td>
                <td className="py-3 text-[#8E8E93]">{gym.openingHours.weekdayClose}</td>
              </tr>
              <tr>
                <td className="py-3 text-white">Fines de semana</td>
                <td className="py-3 text-[#8E8E93]">{gym.openingHours.weekendOpen}</td>
                <td className="py-3 text-[#8E8E93]">{gym.openingHours.weekendClose}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-[#7BFF00]" />
          <h2 className="text-lg font-semibold text-white">Estadisticas rapidas</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[#636366]">Canchas</p>
            <p className="text-2xl font-bold text-[#7BFF00]">{gym.courts.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#636366]">Partidos esta semana</p>
            <p className="text-2xl font-bold text-white">--</p>
          </div>
          <div>
            <p className="text-xs text-[#636366]">Ocupacion media</p>
            <p className="text-2xl font-bold text-white">--</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
