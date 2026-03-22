import type { AuditEntry } from '../../types/audit';

// In-memory audit log store
const auditLog: AuditEntry[] = [
  {
    id: 'audit-001',
    gymId: 'gym-001',
    timestamp: '2026-03-19T09:15:00Z',
    userId: 'user-admin',
    userName: 'Gestor',
    action: 'update',
    entity: 'schedule',
    entityId: 'court-001',
    description: 'Actualizo horario de Canasta Norte a L-V 08:00-22:00',
  },
  {
    id: 'audit-002',
    gymId: 'gym-001',
    timestamp: '2026-03-19T10:30:00Z',
    userId: 'user-admin',
    userName: 'Gestor',
    action: 'create',
    entity: 'reservation',
    entityId: 'res-manual-001',
    description: 'Bloqueo franja 14:00-16:00 en Canasta Sur por mantenimiento',
  },
  {
    id: 'audit-003',
    gymId: 'gym-002',
    timestamp: '2026-03-18T16:45:00Z',
    userId: 'user-admin',
    userName: 'Gestor',
    action: 'update',
    entity: 'pricing',
    entityId: 'price-peak',
    description: 'Subio tarifa hora pico de 6 EUR a 7 EUR',
  },
  {
    id: 'audit-004',
    gymId: 'gym-002',
    timestamp: '2026-03-18T11:20:00Z',
    userId: 'user-admin',
    userName: 'Gestor',
    action: 'create',
    entity: 'promo',
    entityId: 'promo-3',
    description: 'Creo promo Happy Hour 15-17h con descuento de 2 EUR',
  },
  {
    id: 'audit-005',
    gymId: 'gym-003',
    timestamp: '2026-03-17T14:00:00Z',
    userId: 'user-admin',
    userName: 'Gestor',
    action: 'delete',
    entity: 'reservation',
    entityId: 'res-050',
    description: 'Cancelo reserva de Carlos Ruiz por solicitud del jugador',
  },
];

let nextId = auditLog.length + 1;

export function getAuditLog(gymId?: string): AuditEntry[] {
  const filtered = gymId ? auditLog.filter((e) => e.gymId === gymId) : auditLog;
  return [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function addAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp' | 'userId' | 'userName'>,
): void {
  auditLog.push({
    ...entry,
    id: `audit-${String(nextId++).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    userId: 'user-admin',
    userName: 'Gestor',
  });
}
