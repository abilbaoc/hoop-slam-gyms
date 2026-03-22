export interface AuditEntry {
  id: string;
  gymId?: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  entity: 'court' | 'reservation' | 'schedule' | 'pricing' | 'promo';
  entityId: string;
  description: string;
}
