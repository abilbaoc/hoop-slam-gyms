import { useEffect, useState } from 'react';
import { Plus, Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { getGyms, updateGym, createGym } from '../../data/api';
import type { Gym } from '../../types/gym';
import { toast } from 'sonner';

function ClubModal({ gym, onClose, onSaved }: { gym?: Gym; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(gym?.name ?? '');
  const [city, setCity] = useState(gym?.city ?? '');
  const [address, setAddress] = useState(gym?.address ?? '');
  const [saving, setSaving] = useState(false);

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  const handleSave = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    if (!city.trim()) return toast.error('La ciudad es obligatoria');
    setSaving(true);
    try {
      if (gym) {
        await updateGym(gym.id, { name, city, address });
        toast.success('Club actualizado');
      } else {
        await createGym({ name, city, address });
        toast.success('Club creado');
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={gym ? 'Editar club' : 'Crear club'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : gym ? 'Guardar' : 'Crear club'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Nombre del club *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Club Badalona" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Ciudad *</label>
          <input className={inputClass} value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Badalona" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Dirección</label>
          <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, código postal" />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminClubsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editGym, setEditGym] = useState<Gym | undefined>();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = () => getGyms().then(setGyms);
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Clubs</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            Gestión de clubs de la plataforma
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Crear club
        </Button>
      </div>

      {gyms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 size={48} className="text-[#3C3C3E] mb-4" />
          <p className="text-white font-medium text-lg">No hay clubs todavía</p>
          <p className="text-sm text-[#8E8E93] mt-2">Crea el primer club para empezar.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}><Plus size={16} /> Crear club</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2C2C2E] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1C1C1E]">
              <tr className="border-b border-[#2C2C2E]">
                {['Nombre', 'Ciudad', 'Dirección', 'Cestas', 'Acciones'].map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gyms.map(gym => (
                <tr key={gym.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#1C1C1E]/60">
                  <td className="px-4 py-3 text-sm font-medium text-white">{gym.name}</td>
                  <td className="px-4 py-3 text-sm text-[#8E8E93]">{gym.city}</td>
                  <td className="px-4 py-3 text-sm text-[#8E8E93]">{gym.address || '—'}</td>
                  <td className="px-4 py-3 text-sm text-white">{gym.courts.length}</td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === gym.id ? null : gym.id)}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpen === gym.id && (
                      <div className="absolute right-4 top-10 z-10 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl shadow-xl py-1 w-44">
                        <button
                          onClick={() => { setEditGym(gym); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          onClick={() => { toast.error('Eliminar club no implementado en demo'); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#FF453A] hover:bg-[#3C3C3E]"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <ClubModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editGym && <ClubModal gym={editGym} onClose={() => setEditGym(undefined)} onSaved={load} />}
    </div>
  );
}
