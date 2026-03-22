export type UserRole = 'admin' | 'gestor' | 'staff';

export type Permission =
  | 'can_manage_courts'
  | 'can_manage_pricing'
  | 'can_manage_users'
  | 'can_view_analytics'
  | 'can_manage_reservations'
  | 'can_edit_gym_profile'
  | 'can_manage_maintenance';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymIds: string[];
  permissions: Permission[];
  lastActiveAt: string;
  avatarInitials: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'can_manage_courts',
    'can_manage_pricing',
    'can_manage_users',
    'can_view_analytics',
    'can_manage_reservations',
    'can_edit_gym_profile',
    'can_manage_maintenance',
  ],
  gestor: [
    'can_manage_courts',
    'can_manage_pricing',
    'can_view_analytics',
    'can_manage_reservations',
    'can_edit_gym_profile',
    'can_manage_maintenance',
  ],
  staff: ['can_manage_reservations'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  staff: 'Staff',
};
