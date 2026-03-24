import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
import { maintenanceTickets, maintenanceLogs } from './maintenance';

// Re-exporta los logs sin modificacion
export { maintenanceLogs };

/**
 * Datos mock de tickets con campos Hoop asignados de forma realista:
 * - Tickets critical/high recientes tienen hoopStatus activo
 * - Tickets low/medium cerrados no tienen intervencion Hoop
 */
export const maintenanceTicketsWithHoop: MaintenanceTicketWithHoop[] = maintenanceTickets.map((t) => {
  switch (t.id) {
    // maint-003: critical abierto - aro doblado. Hoop acuso recibo, pieza pedida
    case 'maint-003':
      return {
        ...t,
        hoopStatus: 'acknowledged',
        hoopAssignedTo: 'Carlos (Hoop Tech)',
        hoopNotes: 'Aro pedido al proveedor. ETA 2-3 dias laborables.',
        notifiedAt: '2026-03-19T08:05:00Z',
      };

    // maint-008: critical en progreso 9 dias. Hoop instalando modulo WiFi
    case 'maint-008':
      return {
        ...t,
        hoopStatus: 'in_progress',
        hoopAssignedTo: 'Carlos (Hoop Tech)',
        hoopNotes: 'Modulo WiFi de reemplazo en camino. Instalacion prevista manana.',
        notifiedAt: '2026-03-12T08:35:00Z',
      };

    // maint-001: high en progreso. Notificado, esperando respuesta Hoop
    case 'maint-001':
      return {
        ...t,
        hoopStatus: 'pending',
        hoopAssignedTo: null,
        hoopNotes: null,
        notifiedAt: '2026-03-15T10:02:00Z',
      };

    // maint-007: high abierto reciente. Recien notificado
    case 'maint-007':
      return {
        ...t,
        hoopStatus: 'pending',
        hoopAssignedTo: null,
        hoopNotes: null,
        notifiedAt: '2026-03-19T07:02:00Z',
      };

    // maint-006: low cerrado que requirio firmware OTA. Resuelto por Hoop
    case 'maint-006':
      return {
        ...t,
        hoopStatus: 'resolved',
        hoopAssignedTo: 'Carlos (Hoop Tech)',
        hoopNotes: 'Firmware v2.1.3 desplegado via OTA exitosamente.',
        notifiedAt: '2026-03-05T09:05:00Z',
      };

    // Resto: prioridad media/baja sin intervencion del equipo Hoop
    default:
      return {
        ...t,
        hoopStatus: null,
        hoopAssignedTo: null,
        hoopNotes: null,
        notifiedAt: null,
      };
  }
});
