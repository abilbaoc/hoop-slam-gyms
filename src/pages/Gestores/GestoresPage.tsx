import { useState, useEffect, useCallback } from 'react';
import { Shield, UserPlus, Mail, Loader2, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { getUsers, inviteGestor } from '../../data/api';
import { addAllowedEmail } from '../../contexts/AuthContext';
import type { AppUser } from '../../types/auth';

// The Gestores page manages roles 'admin' | 'gestor' | 'staff' from AppUser.
// We also support 'viewer' as a display alias for 'staff' (read-only intent).
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
  const [gestores, setGestores] = useState<AppUser[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<DisplayRole>('gestor');
  const [invitePassword, setInvitePassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // ── Load gestores from Supabase profiles ──────────────────────────────────
  const loadGestores = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const users = await getUsers();
      // Show all profiles that have dashboard roles
      setGestores(users.filter((u) => ['admin', 'gestor', 'staff'].includes(u.role)));
    } catch (err) {
      console.error('[GestoresPage] loadGestores:', err);
      toast.error('No se pudieron cargar los gestores');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadGestores();
  }, [loadGestores]);

  // ── Invite handler ────────────────────────────────────────────────────────
  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    const name = inviteName.trim() || email.split('@')[0];

    if (!email) return toast.error('El email es obligatorio');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Formato de email invalido');
    if (!invitePassword || invitePassword.length < 6) {
      return toast.error('La contrasena debe tener al menos 6 caracteres');
    }
    if (gestores.find((g) => g.email?.toLowerCase() === email)) {
      return toast.error('Este email ya tiene acceso');
    }

    setIsInviting(true);
    try {
      const created = await inviteGestor({
        email,
        name,
        role: inviteRole,
        gymIds: [],
        password: invitePassword,
      });

      // Add to in-memory whitelist immediately so the new user can sign in
      // without waiting for the next page load / get_allowed_emails RPC.
      addAllowedEmail(email);

      // Optimistically add to the local list
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
          avatarInitials: name
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??',
        },
      ]);

      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setInviteRole('gestor');
      toast.success(`Gestor "${name}" creado. Puede iniciar sesion ahora.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al invitar gestor';
      toast.error(msg);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCloseModal = () => {
    if (isInviting) return;
    setShowInvite(false);
    setInviteEmail('');
    setInviteName('');
    setInvitePassword('');
    setInviteRole('gestor');
  };

  const inputClass =
    'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

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
          <div className="text-center py-12 text-[#636366] text-sm">
            No hay gestores configurados
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                {['Nombre', 'Email', 'Rol', 'Acciones'].map((col) => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gestores.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30"
                >
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
                    <Badge variant={ROLE_COLOR[g.role]}>{displayRoleFor(g.role)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {g.role !== 'admin' ? (
                      <span className="text-xs text-[#636366]">—</span>
                    ) : (
                      <span className="text-xs text-[#636366]">Propietario</span>
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
        title="Invitar gestor"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isInviting}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creando...
                </>
              ) : (
                'Invitar'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8E8E93]">
            El gestor podra iniciar sesion inmediatamente con el email y la contrasena que
            establezcas. No se enviara ningun email de confirmacion.
          </p>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
            <input
              className={inputClass}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              disabled={isInviting}
            />
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Nombre</label>
            <input
              className={inputClass}
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Nombre del gestor"
              disabled={isInviting}
            />
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Contrasena inicial *</label>
            <input
              className={inputClass}
              type="password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              disabled={isInviting}
              autoComplete="new-password"
            />
            <p className="text-xs text-[#636366] mt-1">
              El gestor puede cambiarla desde su perfil una vez dentro.
            </p>
          </div>

          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Rol</label>
            <select
              className={inputClass}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as DisplayRole)}
              disabled={isInviting}
            >
              <option value="gestor">Gestor — puede modificar</option>
              <option value="viewer">Solo lectura — solo ver datos</option>
              <option value="admin">Administrador — acceso total</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
