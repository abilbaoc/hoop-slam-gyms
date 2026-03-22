import { useState, useEffect, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppUser, UserRole } from '../../types/auth';
import { ROLE_LABELS } from '../../types/auth';
import { getUsers } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';

const roleTabs = [
  { id: 'all', label: 'Todos' },
  { id: 'admin', label: 'Admin' },
  { id: 'gestor', label: 'Gestor' },
  { id: 'staff', label: 'Staff' },
];

const roleBadgeVariant: Record<UserRole, 'green' | 'blue' | 'gray'> = {
  admin: 'green',
  gestor: 'blue',
  staff: 'gray',
};

export default function UsersPage() {
  const { currentGym } = useGym();
  const { canManageUsers } = usePermissions();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    getUsers(currentGym?.id).then(setUsers);
  }, [currentGym]);

  const filtered = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-[#8E8E93]">{users.length} usuarios registrados</p>
        </div>
        {canManageUsers && (
          <Button variant="primary" size="sm" onClick={() => toast.success('Proximamente')}>
            <UserPlus size={16} />
            Invitar Usuario
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={roleTabs} activeTab={roleFilter} onChange={setRoleFilter} />

      {/* User list */}
      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#636366] text-xs border-b border-[#2C2C2E]">
              <th className="text-left py-3 px-4 font-medium">Usuario</th>
              <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left py-3 px-4 font-medium">Rol</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Ultima actividad</th>
              {canManageUsers && <th className="py-3 px-4 font-medium w-20" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#7BFF00] text-xs font-bold">{user.avatarInitials}</span>
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#8E8E93] hidden sm:table-cell">{user.email}</td>
                <td className="py-3 px-4">
                  <Badge variant={roleBadgeVariant[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                </td>
                <td className="py-3 px-4 text-[#8E8E93] hidden md:table-cell">
                  {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true, locale: es })}
                </td>
                {canManageUsers && (
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" onClick={() => toast.success('Proximamente')}>
                      Editar
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#8E8E93]">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
