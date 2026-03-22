export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type MaintenanceAction = 'created' | 'status_changed' | 'commented' | 'assigned';

export interface MaintenanceTicket {
  id: string;
  courtId: string;
  gymId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface MaintenanceLog {
  id: string;
  ticketId: string;
  action: MaintenanceAction;
  userId: string;
  comment: string | null;
  timestamp: string;
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica',
};
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado',
};
export const PRIORITY_VARIANTS: Record<TicketPriority, 'gray' | 'blue' | 'yellow' | 'red'> = {
  low: 'gray', medium: 'blue', high: 'yellow', critical: 'red',
};
export const STATUS_VARIANTS: Record<TicketStatus, 'yellow' | 'blue' | 'green' | 'gray'> = {
  open: 'yellow', in_progress: 'blue', resolved: 'green', closed: 'gray',
};
