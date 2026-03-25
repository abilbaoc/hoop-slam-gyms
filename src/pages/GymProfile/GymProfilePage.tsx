import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Edit2, Hash, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Gym } from '../../types/gym';
import { getGymById, updateGym } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function GymProfilePage() {
  const { currentGym } = useGym();
  const { canEditGymProfile } = usePermissions();
  const [gym, setGym] = useState<Gym | null>(null);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentGym) {
      getGymById(currentGym.id).then((g) => {
        if (g) setGym(g);
      });
    }
  }, [currentGym]);

  const startEditing = () => {
    if (!gym) return;
    setName(gym.name);
    setAddress(gym.address);
    setCity(gym.city);
    setPhone(gym.phone);
    setEmail(gym.email);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!gym) return;
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      const updated = await updateGym(gym.id, { name, address, city, phone, email });
      setGym(updated);
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

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

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

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
        {canEditGymProfile && !editing && (
          <Button variant="secondary" size="sm" onClick={startEditing}>
            <Edit2 size={14} />
            Editar
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={cancelEditing} disabled={saving}>
              <X size={14} />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Informacion del club</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Nombre *</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del club" />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Ciudad</label>
              <input className={inputClass} value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad" />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Direccion</label>
              <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} placeholder="Direccion completa" />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Telefono</label>
              <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefono" />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Email</label>
              <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email de contacto" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#636366]">Direccion</p>
                <p className="text-sm text-white">{gym.address || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#636366]">Ciudad</p>
                <p className="text-sm text-white">{gym.city || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#636366]">Telefono</p>
                <p className="text-sm text-white">{gym.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-[#7BFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#636366]">Email</p>
                <p className="text-sm text-white">{gym.email || '—'}</p>
              </div>
            </div>
          </div>
        )}
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
            <p className="text-xs text-[#636366]">Cestas</p>
            <p className="text-2xl font-bold text-[#7BFF00]">{gym.courts.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
