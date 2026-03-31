import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, UserPlus, Mail, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { getUsers, inviteGestor, deleteGestor, updateGestorRole } from '../../data/api';
import { addAllowedEmail, useAuth } from '../../contexts/AuthContext';
import { useGym } from '../../contexts/GymContext';
import type { AppUser } from '../../types/auth';

type DisplayRole = 'admin' | 'gestor' | 'viewer';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  staff: 'Staff',
  viewer: 'Solo lectura',
};
const ROLE_COLOR: Record<string, 'green' | 'blue' | 'gray'> = {
  admin: 'green',
  gestor: 'blue',
  staff: 'gray',
  viewer: 'gray',
};
const ROLE_DESC: Record<string, string> = {
  admin: 'Acceso total: config cestas, bloquear slots, gestionar incidencias y usuarios',
  gestor: 'Puede ver datos, bloquear slots y gestionar incidencias',
  viewer: 'Solo puede ver datos del dashboard, sin modificar nada',
};

function displayRoleFor(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

export default function GestoresPage() {
  const { currentUser } = useAuth();
  const { currentGym } = useGym();

  const [gestores, setGestores] = useState<AppUser[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<DisplayRole>('gestor');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteAssignGym, setInviteAssignGym] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const loadGestores = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const users = await getUsers();
      setGestores(users.filter((u) => ['admin', 'gestor', 'staff'].includes(u.role)));
    } catch (err) {
      console.error('[GestoresPage] loadGestores:', err);
      toast.error('No se pudieron cargar los gestores');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => { loadGestores(); }, [loadGestores]);

  // ── Invite ────────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    const name = inviteName.trim() || email.split('@')[0];

    if (!email) return toast.error('El email es obligatorio');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Formato de email invalido');
    if (!invitePassword || invitePassword.length < 6) return toast.error('La contrasena debe tener al menos 6 caracteres');
    if (gestores.find((g) => g.email?.toLowerCase() === email)) return toast.error('Este email ya tiene acceso');

    const gymIds = inviteAssignGym && currentGym ? [currentGym.id] : [];

    setIsInviting(true);
    try {
      const created = await inviteGestor({ email, name, role: inviteRole, gymIds, password: invitePassword });
      addAllowedEmail(email);
      setGestores((prev) => [
        ...prev,
        {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role === 'viewer' ? 'staff' : (created.role as AppUser['role']),
          gymIds: created.gymIds,
          permissions: [],
          lastActiveAt: new Date().toISOString(),
          avatarInitials: name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??',
        },
      ]);
      setShowInvite(false);
      setInviteEmail(''); setInviteName(''); setInvitePassword('');
      setInviteRole('gestor'); setInviteAssignGym(true);
      toast.success(`Usuario "${name}" creado. Puede iniciar sesion ahora.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al invitar');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCloseModal = () => {
    if (isInviting) return;
    setShowInvite(false);
    setInviteEmail(''); setInviteName(''); setInvitePassword('');
    setInviteRole('gestor'); setInviteAssignGym(true);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteGestor(userId);
      setGestores((prev) => prev.filter((g) => g.id !== userId));
      toast.success('Usuario eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  // ── Role change ───────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateGestorRole(userId, newRole);
      setGestores((prev) => prev.map((g) => g.id === userId ? { ...g, role: newRole as AppUser['role'] } : g));
      toast.success('Rol actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar rol');
    } finally {
      setEditingRoleId(null);
    }
  };

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  // Gap 3: solo admins (después de todos los hooks)
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;

  const userToDelete = gestores.find((g) => g.id === confirmDeleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Gestores</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            Personas con acceso al dashboard del club
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadGestores}
            disabled={isLoadingList}
            className="p-2 rounded-lg text-[#636366] hover:text-white hover:bg-[#2C2C2E] transition-colors disabled:opacity-40"
            title="Recargar lista"
          >
            <RefreshCw size={16} className={isLoadingList ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus size={16} />
            Invitar
          </Button>
        </div>
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['admin', 'gestor', 'viewer'] as const).map((role) => (
          <div key={role} className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={ROLE_COLOR[role]}>{ROLE_LABEL[role]}</Badge>
            </div>
            <p className="text-xs text-[#8E8E93]">{ROLE_DESC[role]}</p>
          </div>
        ))}
      </div>

      {/* Gestores list */}
      <Card className="!p-0 overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-12 gap-3 text-[#636366]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando gestores...</span>
          </div>
        ) : gestores.length === 0 ? (
          <div className="text-center py-12 text-[#636366] text-sm">No hay gestores configurados</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Nombre', 'Email', 'Rol', 'Acciones'].map((col) => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gestores.map((g) => (
                <tr key={g.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                        <Shield size={14} className="text-[#7BFF00]" />
                      </div>
                      <span className="text-sm text-white font-medium">{g.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-[#8E8E93]">
                      <Mail size={14} className="flex-shrink-0" />
                      {g.email || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingRoleId === g.id && g.role !== 'admin' ? (
                      <select
                        autoFocus
                        className="bg-[#2C2C2E] text-white text-xs rounded-lg px-2 py-1 border border-[#7BFF00] outline-none"
                        defaultValue={g.role}
                        onChange={(e) => handleRoleChange(g.id, e.target.value)}
                        onBlur={() => setEditingRoleId(null)}
                      >
                        <option value="gestor">Gestor</option>
                        <option value="staff">Solo lectura</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingRoleId(g.id)}
                        className="group flex items-center gap-1"
                        title="Cambiar rol"
                      >
                        <Badge variant={ROLE_COLOR[g.role]}>{displayRoleFor(g.role)}</Badge>
                        <span className="text-[10px] text-[#636366] opacity-0 group-hover:opacity-100 transition-opacity">editar</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {g.id === currentUser?.id ? (
                      <span className="text-xs text-[#636366]">Tú</span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(g.id)}
                        className="flex items-center gap-1 text-xs text-[#636366] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal
        open={showInvite}
        onClose={handleCloseModal}
        title="Invitar usuario"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isInviting}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? <><Loader2 size={14} className="animate-spin" />Creando...</> : 'Invitar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8E8E93]">
            El usuario podra iniciar sesion inmediatamente con el email y la contrasena que establezcas.
          </p>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
            <input className={inputClass} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@ejemplo.com" disabled={isInviting} />
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Nombre</label>
            <input className={inputClass} value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nombre del usuario" disabled={isInviting} />
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Contrasena inicial *</label>
            <input className={inputClass} type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Minimo 6 caracteres" disabled={isInviting} autoComplete="new-password" />
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Rol</label>
            <select className={inputClass} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as DisplayRole)} disabled={isInviting}>
              <option value="gestor">Gestor — puede modificar</option>
              <option value="viewer">Solo lectura — solo ver datos</option>
              <option value="admin">Administrador — acceso total</option>
            </select>
          </div>

          {/* Gap 1: asignar al club actual */}
          {currentGym && (
            <div className="flex items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white">Asignar al club actual</p>
                <p className="text-xs text-[#636366]">{currentGym.name}</p>
              </div>
              <button
                onClick={() => setInviteAssignGym((v) => !v)}
                disabled={isInviting}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0 ${inviteAssignGym ? 'bg-[#7BFF00]' : 'bg-[#3C3C3E]'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${inviteAssignGym ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => !isDeleting && setConfirmDeleteId(null)}
        title="Eliminar usuario"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}>Cancelar</Button>
            <Button onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)} disabled={isDeleting}>
              {isDeleting ? <><Loader2 size={14} className="animate-spin" />Eliminando...</> : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#8E8E93]">
          ¿Eliminar a <span className="text-white font-medium">{userToDelete?.name || userToDelete?.email}</span>? Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
