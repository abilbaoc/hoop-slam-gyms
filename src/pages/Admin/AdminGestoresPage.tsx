import { useEffect, useState, useCallback } from 'react';
import { Plus, UserCog, MoreHorizontal, Pencil, KeyRound, Trash2, Shield, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { getUsers, getGyms, inviteGestor, deleteGestor, updateGestorRole } from '../../data/api';
import type { AppUser } from '../../types/auth';
import type { Gym } from '../../types/gym';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useClickAway } from '../../hooks/useClickAway';

const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';
const selectClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

function GestorModal({ gyms, onClose, onCreated }: { gyms: Gym[]; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymSlug, setGymSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    if (!email.trim()) return toast.error('El email es obligatorio');
    if (!password || password.length < 6) return toast.error('La contrasena debe tener al menos 6 caracteres');
    setSaving(true);
    try {
      await inviteGestor({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'gestor',
        gymIds: gymSlug ? [gymSlug] : [],
        password,
      });
      toast.success(`Gestor creado. Ya puede iniciar sesion con su email y contrasena.`);
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
            {saving ? 'Creando...' : 'Crear gestor'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Nombre completo *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Joan García" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
          <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="gestor@club.com" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Contrasena inicial *</label>
          <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" autoComplete="new-password" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Asignar a club (opcional)</label>
          <select className={selectClass} value={gymSlug} onChange={e => setGymSlug(e.target.value)}>
            <option value="">Sin club asignado</option>
            {gyms.map(g => <option key={g.id} value={g.slug || g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

function EditGestorModal({ user, gyms, onClose, onSaved }: { user: AppUser; gyms: Gym[]; onClose: () => void; onSaved: () => void }) {
  const [gymSlug, setGymSlug] = useState(user.gymIds?.[0] ?? '');
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGestorRole(user.id, role, gymSlug ? [gymSlug] : []);
      toast.success('Usuario actualizado');
      onSaved();
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
      title={`Editar ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Rol</label>
          <select className={selectClass} value={role} onChange={e => setRole(e.target.value as AppUser['role'])}>
            <option value="gestor">Gestor</option>
            <option value="staff">Staff</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Club asignado</label>
          <select className={selectClass} value={gymSlug} onChange={e => setGymSlug(e.target.value)}>
            <option value="">Sin club asignado</option>
            {gyms.map(g => <option key={g.id} value={g.slug || g.id}>{g.name}</option>)}
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

function RowMenu({ user, isSelf, onEdit, onResetPassword, onChangeRole, onDelete, onClose }: {
  user: AppUser;
  isSelf: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onChangeRole: (role: AppUser['role']) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useClickAway<HTMLDivElement>(onClose);
  return (
    <div ref={ref} className="absolute right-4 top-10 z-10 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl shadow-xl py-1 w-48">
      <button onClick={onEdit} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]">
        <Pencil size={14} /> Editar
      </button>
      <button onClick={onResetPassword} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]">
        <KeyRound size={14} /> Resetear contraseña
      </button>
      {!isSelf && (
        <>
          <div className="border-t border-[#3C3C3E] mx-2 my-1" />
          <p className="px-4 py-1 text-[10px] text-[#636366] uppercase">Cambiar rol</p>
          {user.role !== 'admin' && (
            <button onClick={() => onChangeRole('admin')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]">
              <Shield size={14} /> Promover a Admin
            </button>
          )}
          {user.role !== 'gestor' && (
            <button onClick={() => onChangeRole('gestor')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]">
              <UserCog size={14} /> Hacer Gestor
            </button>
          )}
          {user.role !== 'staff' && (
            <button onClick={() => onChangeRole('staff')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3C3C3E]">
              <UserCircle size={14} /> Hacer Staff
            </button>
          )}
          <div className="border-t border-[#3C3C3E] mx-2 my-1" />
          <button onClick={onDelete} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#FF453A] hover:bg-[#3C3C3E]">
            <Trash2 size={14} /> Eliminar
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminGestoresPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    getUsers().then(setUsers).catch((err) => {
      console.error('[AdminGestores] getUsers:', err);
      toast.error('No se pudieron cargar los usuarios');
    });
    getGyms().then(setGyms).catch((err) => {
      console.error('[AdminGestores] getGyms:', err);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Server-side guard is in App.tsx (AdminGuard); this is a defence-in-depth check
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const gymNameForUser = (user: AppUser) => {
    if (!user.gymIds?.length) return '—';
    const g = gyms.find(g => user.gymIds?.includes(g.slug || g.id) || user.gymIds?.includes(g.id));
    return g?.name ?? user.gymIds[0];
  };

  const handleResetPassword = async (user: AppUser) => {
    setMenuOpen(null);
    if (!supabase || !user.email) {
      toast.error('No se pudo enviar el email de recuperacion');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) {
      toast.error('No se pudo enviar el email de recuperacion');
    } else {
      toast.success(`Email de recuperacion enviado a ${user.email}`);
    }
  };

  const handleChangeRole = async (user: AppUser, role: AppUser['role']) => {
    setMenuOpen(null);
    if (!window.confirm(`¿Cambiar el rol de ${user.name} a ${ROLE_BADGE[role].label}?`)) return;
    try {
      await updateGestorRole(user.id, role);
      toast.success(`${user.name} ahora es ${ROLE_BADGE[role].label}`);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteGestor(deleteTarget.id);
      toast.success('Usuario eliminado');
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
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
        <div className="rounded-2xl border border-[#2C2C2E] overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
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
                        <RowMenu
                          user={user}
                          isSelf={user.id === currentUser?.id}
                          onEdit={() => { setMenuOpen(null); setEditTarget(user); }}
                          onResetPassword={() => handleResetPassword(user)}
                          onChangeRole={(role) => handleChangeRole(user, role)}
                          onDelete={() => { setMenuOpen(null); setDeleteTarget(user); }}
                          onClose={() => setMenuOpen(null)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <GestorModal gyms={gyms} onClose={() => setShowCreate(false)} onCreated={load} />}
      {editTarget && <EditGestorModal user={editTarget} gyms={gyms} onClose={() => setEditTarget(null)} onSaved={load} />}

      {/* Confirmar eliminacion */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Eliminar usuario"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancelar</Button>
            <Button onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <><Loader2 size={14} className="animate-spin" /> Eliminando...</> : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#8E8E93]">
          ¿Eliminar a <span className="text-white font-medium">{deleteTarget?.name || deleteTarget?.email}</span>?
          Perderá el acceso al dashboard. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
