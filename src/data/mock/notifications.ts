import type { AppNotification } from '../../types/notification';

export const notifications: AppNotification[] = [
  { id: 'notif-001', gymId: 'gym-001', type: 'maintenance_alert', title: 'Sensor desconectado', message: 'Canasta Norte lleva 2h sin reportar heartbeat. Verificar conexion.', read: false, createdAt: '2026-03-19T11:00:00Z' },
  { id: 'notif-002', gymId: 'gym-001', type: 'reservation_confirmation', title: 'Reserva confirmada', message: 'Carlos Ruiz reservo Canasta Sur para hoy 18:00-18:30.', read: false, createdAt: '2026-03-19T10:30:00Z' },
  { id: 'notif-003', gymId: 'gym-002', type: 'low_occupancy_warning', title: 'Baja ocupacion detectada', message: 'Canasta 2 lleva 3 dias con ocupacion inferior al 15%. Considerar activar promocion.', read: false, createdAt: '2026-03-19T09:00:00Z' },
  { id: 'notif-004', gymId: 'gym-002', type: 'maintenance_alert', title: 'Mantenimiento programado', message: 'Canasta 2 tiene mantenimiento preventivo programado para el 25/03.', read: true, createdAt: '2026-03-18T16:00:00Z' },
  { id: 'notif-005', gymId: 'gym-003', type: 'system_alert', title: 'Actualizacion de firmware disponible', message: 'Canasta Exterior tiene firmware v1.9.5. Disponible v2.1.3.', read: false, createdAt: '2026-03-19T08:00:00Z' },
  { id: 'notif-006', gymId: 'gym-001', type: 'reservation_confirmation', title: 'Reserva cancelada', message: 'Elena Jimenez cancelo su reserva de manana 10:00 en Canasta Norte.', read: true, createdAt: '2026-03-18T15:00:00Z' },
  { id: 'notif-007', gymId: 'gym-003', type: 'maintenance_alert', title: 'LED panel sin respuesta', message: 'Panel LED de Canasta Principal no responde desde hace 4h.', read: false, createdAt: '2026-03-19T07:00:00Z' },
  { id: 'notif-008', gymId: 'gym-002', type: 'reservation_confirmation', title: 'Bloqueo de franja', message: 'Se bloqueo franja 14:00-16:00 en Canasta 1 por evento privado.', read: true, createdAt: '2026-03-18T12:00:00Z' },
  { id: 'notif-009', gymId: 'gym-001', type: 'low_occupancy_warning', title: 'Horario valle sin reservas', message: 'Franja 08:00-10:00 de lunes a miercoles sin reservas esta semana.', read: false, createdAt: '2026-03-18T11:00:00Z' },
  { id: 'notif-010', gymId: 'gym-003', type: 'system_alert', title: 'Nuevo jugador registrado', message: '3 nuevos jugadores se registraron en la zona de Mar Bella esta semana.', read: true, createdAt: '2026-03-17T18:00:00Z' },
  { id: 'notif-011', gymId: 'gym-002', type: 'reservation_confirmation', title: 'Reserva confirmada', message: 'Miguel Navarro reservo Canasta Este para manana 17:00-17:30.', read: false, createdAt: '2026-03-19T06:00:00Z' },
  { id: 'notif-012', gymId: 'gym-001', type: 'system_alert', title: 'Reporte semanal listo', message: 'Tu reporte de actividad de la semana 11-17 marzo esta disponible.', read: true, createdAt: '2026-03-17T09:00:00Z' },
  { id: 'notif-013', gymId: 'gym-003', type: 'low_occupancy_warning', title: 'Canasta offline 3+ dias', message: 'Canasta Exterior lleva 9 dias offline. Revisar estado del equipo.', read: false, createdAt: '2026-03-19T05:00:00Z' },
  { id: 'notif-014', gymId: 'gym-002', type: 'maintenance_alert', title: 'Bateria baja en sensor', message: 'Sensor de Canasta Este reporta bateria al 12%.', read: false, createdAt: '2026-03-18T10:00:00Z' },
  { id: 'notif-015', gymId: 'gym-001', type: 'reservation_confirmation', title: 'Reserva confirmada', message: 'Adrian Diaz reservo Canasta Norte para hoy 20:00-20:30.', read: false, createdAt: '2026-03-19T04:00:00Z' },
];
