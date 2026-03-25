import { useEffect, useState } from 'react';
import { Plus, UserCog, MoreHorizontal, Pencil, KeyRound, Trash2, Mail, Shield, UserCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { getUsers, getGyms, updateUserRole } from '../../data/api';
import type { AppUser } from '../../types/auth';
import type { Gym } from '../../types/gym';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function GestorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gymId, setGymId] = useState('');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getGyms().then(setGyms); }, []);

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';
  const selectClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    if (!email.trim()) return toast.error('El email es obligatorio');
    setSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gestor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ name, email, gymId: gymId || null, role: 'gestor' }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      toast.success(`Invitación enviada a ${email}. El gestor recibirá un email para activar su cuenta.`);
      onCreated();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Crear gestor"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Enviando...' : <><Mail size={14} /> Enviar invitación</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0A84FF]/8 border-l-2 border-[#0A84FF]">
          <p className="text-xs text-[#8E8E93]">
            El gestor recibirá un email de invitación para crear su contraseña y acceder al dashboard.
          </p>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Nombre completo *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Joan García" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
          <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="gestor@club.com" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Asignar a club (opcional)</label>
          <select className={selectClass} value={gymId} onChange={e => setGymId(e.target.value)}>
            <option value="">Selecciona un club</option>
            {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

const ROLE_BADGE: Record<string, { variant: 'green' | 'blue' | 'gray'; label: string }> = {
  admin: { variant: 'green', label: 'Admin' },
  gestor: { variant: 'blue', label: 'Gestor' },
  staff: { variant: 'gray', label: 'Staff' },
};

export default function AdminGestoresPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Server-side guard is in App.tsx (AdminGuard); this is a defence-in-depth check
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const load = () => {
    getUsers().then(setUsers);
    getGyms().then(setGyms);
  };

  useEffect(() => { load(); }, []);

  const gymNameForUser = (user: AppUser) => {
    if (!user.gymIds?.length) return '—';
    const g = gyms.find(g => user.gymIds?.includes(g.id));
    return g?.name ?? '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Gestores</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            Usuarios con acceso al dashboard
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Crear gestor
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCog size={48} className="text-[#3C3C3E] mb-4" />
          <p className="text-white font-medium text-lg">No hay gestores todavía</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}><Plus size={16} /> Crear gestor</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2C2C2E] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1C1C1E]">
              <tr className="border-b border-[#2C2C2E]">
                {['Nombre', 'Email', 'Rol', 'Club asignado', 'Acciones'].map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const rb = ROLE_BADGE[user.role] ?? ROLE_BADGE.staff;
                return (
                  <tr key={user.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#1C1C1E]/60">
                    <td className="px-4 py-3 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">{user.email}</td>
                    <td className="px-4 py-3"><Badge variant={rb.variant}>{rb.label}</Badge></td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">{gymNameForUser(user)}</td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === user.id && (
                        <div className="absolute right-4 top-10 z-10 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl shadow-xl py-1 w-48">
                          <button
                            onClick={() => { toast.info('Editar gestor — en construcción'); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                          >
                            <Pencil size={14} /> Editar
                          </button>
                          <button
                            onClick={() => { toast.info('Email de reset enviado'); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                          >
                            <KeyRound size={14} /> Resetear contraseña
                          </button>
                          <div className="border-t border-[#3C3C3E] mx-2 my-1" />
                          <p className="px-4 py-1 text-[10px] text-[#636366] uppercase">Cambiar rol</p>
                          {user.role !== 'admin' && (
                            <button
                              onClick={async () => {
                                await updateUserRole(user.id, 'admin');
                                toast.success(`${user.name} promovido a Admin`);
                                setMenuOpen(null);
                                load();
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                            >
                              <Shield size={14} /> Promover a Admin
                            </button>
                          )}
                          {user.role !== 'gestor' && (
                            <button
                              onClick={async () => {
                                await updateUserRole(user.id, 'gestor');
                                toast.success(`${user.name} ahora es Responsable`);
                                setMenuOpen(null);
                                load();
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                            >
                              <UserCog size={14} /> Hacer Responsable
                            </button>
                          )}
                          {user.role !== 'staff' && (
                            <button
                              onClick={async () => {
                                await updateUserRole(user.id, 'staff');
                                toast.success(`${user.name} ahora es Staff`);
                                setMenuOpen(null);
                                load();
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]"
                            >
                              <UserCircle size={14} /> Hacer Staff
                            </button>
                          )}
                          <div className="border-t border-[#3C3C3E] mx-2 my-1" />
                          <button
                            onClick={() => { toast.error('Eliminar gestor no implementado en demo'); setMenuOpen(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#FF453A] hover:bg-[#3C3C3E]"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <GestorModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
