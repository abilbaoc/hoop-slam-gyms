import type { MaintenanceTicket } from './maintenance';

// Estado del ticket desde el lado del equipo tecnico de Hoop Slam
export type HoopTicketStatus = 'pending' | 'acknowledged' | 'in_progress' | 'resolved';

// Extiende MaintenanceTicket con los campos de comunicacion Hoop
export interface MaintenanceTicketWithHoop extends MaintenanceTicket {
  hoopStatus: HoopTicketStatus | null;
  hoopAssignedTo: string | null;   // Nombre del tecnico Hoop asignado
  hoopNotes: string | null;        // Respuesta/notas del equipo Hoop, visibles al gym
  notifiedAt: string | null;       // Timestamp cuando se notifico a Hoop
}

export const HOOP_STATUS_LABELS: Record<HoopTicketStatus, string> = {
  pending:      'Hoop notificado',
  acknowledged: 'Hoop recibido',
  in_progress:  'Hoop en atencion',
  resolved:     'Resuelto por Hoop',
};

// Mapeo a variantes del componente Badge existente
// 'purple' no existe en el Badge actual — hoop-dashboard debe anadir esta variante o usar 'blue'
export const HOOP_STATUS_VARIANTS: Record<HoopTicketStatus, 'yellow' | 'blue' | 'green'> = {
  pending:      'yellow',
  acknowledged: 'blue',
  in_progress:  'blue',
  resolved:     'green',
};

// Colores exactos por estado (para uso inline si Badge no tiene la variante)
export const HOOP_STATUS_COLORS: Record<HoopTicketStatus, string> = {
  pending:      '#FF9F0A',  // warning orange
  acknowledged: '#0A84FF',  // blue
  in_progress:  '#0A84FF',  // blue
  resolved:     '#34C759',  // success green
};

/**
 * Determina si un ticket debe notificar automaticamente al equipo Hoop al crearse.
 * Prioridad 'high' o 'critical' dispara la notificacion automatica.
 */
export function needsHoopNotification(ticket: Pick<MaintenanceTicket, 'priority'>): boolean {
  return ticket.priority === 'high' || ticket.priority === 'critical';
}
