import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { currentUser, hasPermission } = useAuth();
  return {
    canManageCourts: hasPermission('can_manage_courts'),
    canManagePricing: hasPermission('can_manage_pricing'),
    canManageUsers: hasPermission('can_manage_users'),
    canViewAnalytics: hasPermission('can_view_analytics'),
    canManageReservations: hasPermission('can_manage_reservations'),
    canEditGymProfile: hasPermission('can_edit_gym_profile'),
    canManageMaintenance: hasPermission('can_manage_maintenance'),
    isAdmin: currentUser?.role === 'admin',
  };
}
