export type NotificationType =
  | 'maintenance_alert'
  | 'reservation_confirmation'
  | 'system_alert'
  | 'low_occupancy_warning';

export interface AppNotification {
  id: string;
  gymId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
