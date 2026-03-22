import type { MaintenanceTicket, MaintenanceLog } from '../../types/maintenance';

export const maintenanceTickets: MaintenanceTicket[] = [
  { id: 'maint-001', courtId: 'court-001', gymId: 'gym-001', title: 'Sensor de proximidad intermitente', description: 'El sensor falla al detectar jugadores cerca del aro. Necesita recalibracion o reemplazo.', priority: 'high', status: 'in_progress', assignedTo: 'user-005', createdBy: 'user-002', createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-17T14:00:00Z', resolvedAt: null },
  { id: 'maint-002', courtId: 'court-002', gymId: 'gym-001', title: 'LED scoreboard apagado', description: 'El panel LED no enciende. Verificar alimentacion electrica y conexiones.', priority: 'medium', status: 'open', assignedTo: null, createdBy: 'user-002', createdAt: '2026-03-18T09:00:00Z', updatedAt: '2026-03-18T09:00:00Z', resolvedAt: null },
  { id: 'maint-003', courtId: 'court-004', gymId: 'gym-002', title: 'Aro doblado - impacto fuerte', description: 'Aro de la canasta principal sufrio impacto. Requiere reemplazo urgente.', priority: 'critical', status: 'open', assignedTo: 'user-003', createdBy: 'user-003', createdAt: '2026-03-19T08:00:00Z', updatedAt: '2026-03-19T08:00:00Z', resolvedAt: null },
  { id: 'maint-004', courtId: 'court-003', gymId: 'gym-002', title: 'Recalibrar sensor de tiros', description: 'El contador de tiros muestra lecturas incorrectas. Recalibrar via firmware.', priority: 'low', status: 'resolved', assignedTo: 'user-006', createdBy: 'user-003', createdAt: '2026-03-10T11:00:00Z', updatedAt: '2026-03-14T16:00:00Z', resolvedAt: '2026-03-14T16:00:00Z' },
  { id: 'maint-005', courtId: 'court-005', gymId: 'gym-002', title: 'Red rota', description: 'La red de la canasta tiene agujeros grandes. Reemplazar red completa.', priority: 'medium', status: 'in_progress', assignedTo: 'user-006', createdBy: 'user-003', createdAt: '2026-03-16T10:00:00Z', updatedAt: '2026-03-18T11:00:00Z', resolvedAt: null },
  { id: 'maint-006', courtId: 'court-006', gymId: 'gym-003', title: 'Firmware desactualizado v1.2', description: 'Actualizar firmware del sensor a v2.1.3 para corregir bugs de conteo.', priority: 'low', status: 'closed', assignedTo: 'user-007', createdBy: 'user-004', createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-08T15:00:00Z', resolvedAt: '2026-03-08T15:00:00Z' },
  { id: 'maint-007', courtId: 'court-007', gymId: 'gym-003', title: 'Pantalla LED parpadea', description: 'La pantalla de marcador parpadea cada 5 segundos. Posible problema con el driver.', priority: 'high', status: 'open', assignedTo: 'user-004', createdBy: 'user-004', createdAt: '2026-03-19T07:00:00Z', updatedAt: '2026-03-19T07:00:00Z', resolvedAt: null },
  { id: 'maint-008', courtId: 'court-008', gymId: 'gym-003', title: 'Sensor completamente offline', description: 'Sensor no reporta heartbeat desde hace 9 dias. Verificar alimentacion y WiFi.', priority: 'critical', status: 'in_progress', assignedTo: 'user-007', createdBy: 'user-004', createdAt: '2026-03-12T08:00:00Z', updatedAt: '2026-03-19T10:00:00Z', resolvedAt: null },
  { id: 'maint-009', courtId: 'court-001', gymId: 'gym-001', title: 'Limpieza profunda tablero', description: 'Mantenimiento preventivo: limpiar tablero y verificar tornillos de soporte.', priority: 'low', status: 'closed', assignedTo: 'user-005', createdBy: 'user-002', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-02T12:00:00Z', resolvedAt: '2026-03-02T12:00:00Z' },
  { id: 'maint-010', courtId: 'court-005', gymId: 'gym-002', title: 'Bateria sensor baja al 12%', description: 'El sensor reporta bateria critica. Reemplazar bateria antes de que se apague.', priority: 'medium', status: 'open', assignedTo: null, createdBy: 'user-003', createdAt: '2026-03-18T10:00:00Z', updatedAt: '2026-03-18T10:00:00Z', resolvedAt: null },
];

export const maintenanceLogs: MaintenanceLog[] = [
  { id: 'mlog-001', ticketId: 'maint-001', action: 'created', userId: 'user-002', comment: null, timestamp: '2026-03-15T10:00:00Z' },
  { id: 'mlog-002', ticketId: 'maint-001', action: 'assigned', userId: 'user-002', comment: 'Asignado a Javier Garcia', timestamp: '2026-03-15T10:05:00Z' },
  { id: 'mlog-003', ticketId: 'maint-001', action: 'status_changed', userId: 'user-005', comment: 'Comenzando diagnostico del sensor', timestamp: '2026-03-17T14:00:00Z' },
  { id: 'mlog-004', ticketId: 'maint-002', action: 'created', userId: 'user-002', comment: null, timestamp: '2026-03-18T09:00:00Z' },
  { id: 'mlog-005', ticketId: 'maint-003', action: 'created', userId: 'user-003', comment: 'Urgente: aro peligroso para jugadores', timestamp: '2026-03-19T08:00:00Z' },
  { id: 'mlog-006', ticketId: 'maint-004', action: 'created', userId: 'user-003', comment: null, timestamp: '2026-03-10T11:00:00Z' },
  { id: 'mlog-007', ticketId: 'maint-004', action: 'status_changed', userId: 'user-006', comment: 'Sensor recalibrado via firmware update', timestamp: '2026-03-14T16:00:00Z' },
  { id: 'mlog-008', ticketId: 'maint-005', action: 'created', userId: 'user-003', comment: null, timestamp: '2026-03-16T10:00:00Z' },
  { id: 'mlog-009', ticketId: 'maint-005', action: 'assigned', userId: 'user-003', comment: 'Asignado a Laura Sanchez', timestamp: '2026-03-16T10:05:00Z' },
  { id: 'mlog-010', ticketId: 'maint-005', action: 'commented', userId: 'user-006', comment: 'Red nueva pedida al proveedor. Llega el 20/03.', timestamp: '2026-03-18T11:00:00Z' },
  { id: 'mlog-011', ticketId: 'maint-006', action: 'created', userId: 'user-004', comment: null, timestamp: '2026-03-05T09:00:00Z' },
  { id: 'mlog-012', ticketId: 'maint-006', action: 'status_changed', userId: 'user-007', comment: 'Firmware actualizado a v2.1.3', timestamp: '2026-03-08T15:00:00Z' },
  { id: 'mlog-013', ticketId: 'maint-007', action: 'created', userId: 'user-004', comment: 'Reportado por jugador durante partido', timestamp: '2026-03-19T07:00:00Z' },
  { id: 'mlog-014', ticketId: 'maint-008', action: 'created', userId: 'user-004', comment: null, timestamp: '2026-03-12T08:00:00Z' },
  { id: 'mlog-015', ticketId: 'maint-008', action: 'assigned', userId: 'user-004', comment: 'Asignado a Diego Torres', timestamp: '2026-03-12T08:30:00Z' },
  { id: 'mlog-016', ticketId: 'maint-008', action: 'commented', userId: 'user-007', comment: 'WiFi del gimnasio funciona. Problema parece ser el modulo WiFi del sensor.', timestamp: '2026-03-15T09:00:00Z' },
  { id: 'mlog-017', ticketId: 'maint-008', action: 'status_changed', userId: 'user-007', comment: 'Probando reemplazo de modulo WiFi', timestamp: '2026-03-19T10:00:00Z' },
  { id: 'mlog-018', ticketId: 'maint-009', action: 'created', userId: 'user-002', comment: null, timestamp: '2026-03-01T10:00:00Z' },
  { id: 'mlog-019', ticketId: 'maint-009', action: 'status_changed', userId: 'user-005', comment: 'Limpieza completada. Todo en orden.', timestamp: '2026-03-02T12:00:00Z' },
  { id: 'mlog-020', ticketId: 'maint-010', action: 'created', userId: 'user-003', comment: 'Bateria al 12%. Prioridad media por ahora.', timestamp: '2026-03-18T10:00:00Z' },
];
