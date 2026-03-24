import type { CourtSlot } from '../../types/slot';

export let courtSlots: CourtSlot[] = [
  // court-001 — 2026-03-24
  { id: 'slot-001', courtId: 'court-001', date: '2026-03-24', startTime: '09:00', endTime: '09:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-002', courtId: 'court-001', date: '2026-03-24', startTime: '09:30', endTime: '10:00', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-003', courtId: 'court-001', date: '2026-03-24', startTime: '10:00', endTime: '10:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-004', courtId: 'court-001', date: '2026-03-24', startTime: '10:30', endTime: '11:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-005', courtId: 'court-001', date: '2026-03-24', startTime: '11:00', endTime: '11:30', status: 'blocked', createdAt: '2026-03-20T08:00:00Z' },
  // court-001 — 2026-03-25
  { id: 'slot-006', courtId: 'court-001', date: '2026-03-25', startTime: '09:00', endTime: '09:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-007', courtId: 'court-001', date: '2026-03-25', startTime: '09:30', endTime: '10:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-008', courtId: 'court-001', date: '2026-03-25', startTime: '10:00', endTime: '10:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  // court-002 — 2026-03-24
  { id: 'slot-009', courtId: 'court-002', date: '2026-03-24', startTime: '09:00', endTime: '09:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-010', courtId: 'court-002', date: '2026-03-24', startTime: '09:30', endTime: '10:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-011', courtId: 'court-002', date: '2026-03-24', startTime: '10:00', endTime: '10:30', status: 'blocked', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-012', courtId: 'court-002', date: '2026-03-24', startTime: '10:30', endTime: '11:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-013', courtId: 'court-002', date: '2026-03-24', startTime: '11:00', endTime: '11:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  // court-002 — 2026-03-26
  { id: 'slot-014', courtId: 'court-002', date: '2026-03-26', startTime: '09:00', endTime: '09:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-015', courtId: 'court-002', date: '2026-03-26', startTime: '09:30', endTime: '10:00', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  // court-003 — 2026-03-24
  { id: 'slot-016', courtId: 'court-003', date: '2026-03-24', startTime: '07:00', endTime: '07:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-017', courtId: 'court-003', date: '2026-03-24', startTime: '07:30', endTime: '08:00', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-018', courtId: 'court-003', date: '2026-03-24', startTime: '08:00', endTime: '08:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-019', courtId: 'court-003', date: '2026-03-24', startTime: '08:30', endTime: '09:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-020', courtId: 'court-003', date: '2026-03-24', startTime: '09:00', endTime: '09:30', status: 'blocked', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-021', courtId: 'court-003', date: '2026-03-24', startTime: '09:30', endTime: '10:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  // court-005 — 2026-03-25
  { id: 'slot-022', courtId: 'court-005', date: '2026-03-25', startTime: '10:00', endTime: '10:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-023', courtId: 'court-005', date: '2026-03-25', startTime: '10:30', endTime: '11:00', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-024', courtId: 'court-005', date: '2026-03-25', startTime: '11:00', endTime: '11:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-025', courtId: 'court-005', date: '2026-03-25', startTime: '11:30', endTime: '12:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-026', courtId: 'court-005', date: '2026-03-25', startTime: '12:00', endTime: '12:30', status: 'blocked', createdAt: '2026-03-20T08:00:00Z' },
  // court-006 — 2026-03-27
  { id: 'slot-027', courtId: 'court-006', date: '2026-03-27', startTime: '09:00', endTime: '09:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-028', courtId: 'court-006', date: '2026-03-27', startTime: '09:30', endTime: '10:00', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-029', courtId: 'court-006', date: '2026-03-27', startTime: '10:00', endTime: '10:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-030', courtId: 'court-006', date: '2026-03-27', startTime: '10:30', endTime: '11:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-031', courtId: 'court-006', date: '2026-03-27', startTime: '11:00', endTime: '11:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  // court-007 — 2026-03-28
  { id: 'slot-032', courtId: 'court-007', date: '2026-03-28', startTime: '09:00', endTime: '09:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-033', courtId: 'court-007', date: '2026-03-28', startTime: '09:30', endTime: '10:00', status: 'blocked', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-034', courtId: 'court-007', date: '2026-03-28', startTime: '10:00', endTime: '10:30', status: 'reserved', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-035', courtId: 'court-007', date: '2026-03-28', startTime: '10:30', endTime: '11:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-036', courtId: 'court-007', date: '2026-03-28', startTime: '11:00', endTime: '11:30', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
  { id: 'slot-037', courtId: 'court-007', date: '2026-03-28', startTime: '11:30', endTime: '12:00', status: 'available', createdAt: '2026-03-20T08:00:00Z' },
];
