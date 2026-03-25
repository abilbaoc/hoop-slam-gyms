import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Trash2, Mail, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { getTeamMembers, revokeTeamMember } from '../../data/api';
import type { AppUser } from '../../types/auth';
import { toast } from 'sonner';
import { useGymLayout } from '../../layouts/GymLayout';
import { supabase } from '../../lib/supabase';

function InviteModal({ gymId, onClose, onInvited }: { gymId: string; onClose: () => void; onInvited: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  const handleInvite = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    if (!email.trim()) return toast.error('El email es obligatorio');
    setSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ name, email, gymId, role: 'staff' }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      toast.success(`Invitación enviada a ${email}`);
      onInvited();
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
      title="Invitar al equipo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleInvite} disabled={saving}>
            {saving ? 'Enviando...' : <><Mail size={14} /> Enviar invitación</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0A84FF]/8 border-l-2 border-[#0A84FF]">
          <p className="text-xs text-[#8E8E93]">
            El nuevo miembro recibirá un email para activar su cuenta y acceder al panel de este club.
          </p>
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Nombre completo *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Maria Lopez" />
        </div>
        <div>
          <label className="text-xs text-[#8E8E93] mb-1 block">Email *</label>
          <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="gestor@club.com" />
        </div>
      </div>
    </Modal>
  );
}

const ROLE_BADGE: Record<string, { variant: 'green' | 'blue' | 'gray'; label: string }> = {
  admin: { variant: 'green', label: 'Admin' },
  gestor: { variant: 'blue', label: 'Responsable' },
  staff: { variant: 'gray', label: 'Staff' },
};

export default function TeamPage() {
  const { gymId } = useGymLayout();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getTeamMembers(gymId);
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [gymId]);

  const handleRevoke = async (user: AppUser) => {
    if (!confirm(`¿Revocar acceso de ${user.name} a este club?`)) return;
    try {
      await revokeTeamMember(user.id, gymId);
      toast.success(`Acceso de ${user.name} revocado`);
      load();
    } catch {
      toast.error('Error al revocar acceso');
    }
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Equipo</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            Gestiona quién tiene acceso a tu club
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus size={16} /> Invitar miembro
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-[#1C1C1E] animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={48} className="text-[#3C3C3E] mb-4" />
          <p className="text-white font-medium text-lg">Aún no hay equipo</p>
          <p className="text-sm text-[#8E8E93] mt-1">Invita a los primeros gestores de tu club</p>
          <Button className="mt-4" onClick={() => setShowInvite(true)}><Plus size={16} /> Invitar miembro</Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2C2C2E] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1C1C1E]">
              <tr className="border-b border-[#2C2C2E]">
                {['Nombre', 'Email', 'Rol', 'Acciones'].map(col => (
                  <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const rb = ROLE_BADGE[member.role] ?? ROLE_BADGE.staff;
                return (
                  <tr key={member.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#1C1C1E]/60">
                    <td className="px-4 py-3 text-sm font-medium text-white">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">{member.email || '—'}</td>
                    <td className="px-4 py-3"><Badge variant={rb.variant}>{rb.label}</Badge></td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === member.id && (
                        <div className="absolute right-4 top-10 z-10 bg-[#2C2C2E] border border-[#3C3C3E] rounded-xl shadow-xl py-1 w-44">
                          <button
                            onClick={() => handleRevoke(member)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#FF453A] hover:bg-[#3C3C3E]"
                          >
                            <Trash2 size={14} /> Revocar acceso
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

      {showInvite && (
        <InviteModal gymId={gymId} onClose={() => setShowInvite(false)} onInvited={load} />
      )}
    </div>
  );
}
