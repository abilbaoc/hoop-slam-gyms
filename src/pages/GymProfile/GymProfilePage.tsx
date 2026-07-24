import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Edit2, Hash, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Gym, GymOpeningHours } from '../../types/gym';
import { getGymById, updateGym, getCourts } from '../../data/api';
import { useGymLayout } from '../../layouts/GymLayout';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const DEFAULT_HOURS: GymOpeningHours = {
  weekdayOpen: '09:00', weekdayClose: '21:00',
  weekendOpen: '10:00', weekendClose: '20:00',
};

export default function GymProfilePage() {
  const { gym: currentGym } = useGymLayout();
  const { canEditGymProfile } = usePermissions();
  const [gym, setGym] = useState<Gym | null | undefined>(undefined); // undefined=cargando, null=no encontrado
  const [courtCount, setCourtCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState<GymOpeningHours>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentGym) {
      getGymById(currentGym.id)
        .then((g) => setGym(g ?? null))
        .catch((err) => {
          console.error('[GymProfile] getGymById:', err);
          setGym(null);
        });
      getCourts(currentGym.id)
        .then((cs) => setCourtCount(cs.length))
        .catch(() => setCourtCount(null));
    }
  }, [currentGym]);

  const startEditing = () => {
    if (!gym) return;
    setName(gym.name);
    setAddress(gym.address);
    setCity(gym.city);
    setPhone(gym.phone);
    setEmail(gym.email);
    setHours(gym.openingHours ?? DEFAULT_HOURS);
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
      const updated = await updateGym(gym.id, { name, address, city, phone, email, openingHours: hours });
      setGym(updated);
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch (err) {
      console.error('[GymProfile] updateGym:', err);
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (gym === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8E8E93]">Cargando perfil...</p>
      </div>
    );
  }

  if (gym === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-white font-medium">No se pudo cargar el perfil del club</p>
        <p className="text-sm text-[#8E8E93] mt-2">Recarga la página o inténtalo más tarde.</p>
      </div>
    );
  }

  const openingHours = gym.openingHours ?? DEFAULT_HOURS;

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
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Lunes a Viernes — Apertura</label>
              <input type="time" className={inputClass} value={hours.weekdayOpen} onChange={e => setHours(h => ({ ...h, weekdayOpen: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Lunes a Viernes — Cierre</label>
              <input type="time" className={inputClass} value={hours.weekdayClose} onChange={e => setHours(h => ({ ...h, weekdayClose: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Fines de semana — Apertura</label>
              <input type="time" className={inputClass} value={hours.weekendOpen} onChange={e => setHours(h => ({ ...h, weekendOpen: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[#8E8E93] mb-1 block">Fines de semana — Cierre</label>
              <input type="time" className={inputClass} value={hours.weekendClose} onChange={e => setHours(h => ({ ...h, weekendClose: e.target.value }))} />
            </div>
          </div>
        ) : (
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
                  <td className="py-3 text-[#8E8E93]">{openingHours.weekdayOpen}</td>
                  <td className="py-3 text-[#8E8E93]">{openingHours.weekdayClose}</td>
                </tr>
                <tr>
                  <td className="py-3 text-white">Fines de semana</td>
                  <td className="py-3 text-[#8E8E93]">{openingHours.weekendOpen}</td>
                  <td className="py-3 text-[#8E8E93]">{openingHours.weekendClose}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Stats Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-[#7BFF00]" />
          <h2 className="text-lg font-semibold text-white">Estadisticas rapidas</h2>
        </div>
        <div>
          <p className="text-xs text-[#636366]">Cestas del club</p>
          <p className="text-2xl font-bold text-[#7BFF00]">{courtCount ?? '—'}</p>
        </div>
      </Card>
    </div>
  );
}
