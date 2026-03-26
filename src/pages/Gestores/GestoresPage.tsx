import { useState } from 'react';
import { Shield, UserPlus, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';

interface Gestor {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gestor' | 'viewer';
  lastActive?: string;
}

const ROLE_LABEL: Record<string, string> = { admin: 'Administrador', gestor: 'Gestor', viewer: 'Solo lectura' };
const ROLE_COLOR: Record<string, 'green' | 'blue' | 'gray'> = { admin: 'green', gestor: 'blue', viewer: 'gray' };
const ROLE_DESC: Record<string, string> = {
  admin: 'Acceso total: config cestas, bloquear slots, gestionar incidencias y usuarios',
  gestor: 'Puede ver datos, bloquear slots y gestionar incidencias',
  viewer: 'Solo puede ver datos del dashboard, sin modificar nada',
};

// Current gestores — in production these would come from Supabase profiles
const INITIAL_GESTORES: Gestor[] = [
  { id: '1', email: 'laieta@hoopslam.net', name: 'Laietà', role: 'admin', lastActive: new Date().toISOString() },
];

export default function GestoresPage() {
  const [gestores, setGestores] = useState<Gestor[]>(INITIAL_GESTORES);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'gestor' | 'viewer'>('gestor');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return toast.error('El email es obligatorio');
    if (gestores.find(g => g.email === inviteEmail.trim())) return toast.error('Este email ya tiene acceso');
    setGestores(prev => [...prev, {
      id: `g-${Date.now()}`,
      email: inviteEmail.trim(),
      name: inviteName.trim() || inviteEmail.split('@')[0],
      role: inviteRole,
    }]);
    setShowInvite(false);
    setInviteEmail('');
    setInviteName('');
    toast.success('Gestor invitado (pendiente de activar en Supabase)');
  };

  const handleRemove = (id: string) => {
    const g = gestores.find(x => x.id === id);
    if (g?.role === 'admin') return toast.error('No se puede eliminar al administrador');
    setGestores(prev => prev.filter(x => x.id !== id));
    toast.success('Acceso revocado');
  };

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Gestores</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            Personas con acceso al dashboard del club
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus size={16} />
          Invitar
        </Button>
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['admin', 'gestor', 'viewer'] as const).map(role => (
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
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#2C2C2E]">
              {['Nombre', 'Email', 'Rol', 'Acciones'].map(col => (
                <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gestores.map(g => (
              <tr key={g.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                      <Shield size={14} className="text-[#7BFF00]" />
                    </div>
                    <span className="text-sm text-white font-medium">{g.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-[#8E8E93]">
                    <Mail size={14} className="flex-shrink-0" />
                    {g.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_COLOR[g.role]}>{ROLE_LABEL[g.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {g.role !== 'admin' ? (
                    <button
                      onClick={() => handleRemove(g.id)}
                      className="text-xs text-[#FF453A] hover:text-white transition-colors"
                    >
                      Revocar acceso
                    </button>
                  ) : (
                    <span className="text-xs text-[#636366]">Propietario</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invitar gestor"
        footer={<><Button variant="secondary" onClick={() => setShowInvite(false)}>Cancelar</Button><Button onClick={handleInvite}>Invitar</Button></>}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8E8E93]">El gestor recibira acceso al dashboard con el rol seleccionado.</p>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
            <input className={inputClass} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Nombre</label>
            <input className={inputClass} value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Nombre del gestor" />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Rol</label>
            <select className={inputClass} value={inviteRole} onChange={e => setInviteRole(e.target.value as 'gestor' | 'viewer')}>
              <option value="gestor">Gestor — puede modificar</option>
              <option value="viewer">Solo lectura — solo ver datos</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
