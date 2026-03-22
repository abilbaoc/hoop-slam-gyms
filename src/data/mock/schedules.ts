import type { CourtSchedule, ScheduleException } from '../../types';
import { courts } from './courts';

export const schedules: CourtSchedule[] = courts.map((court) => {
  if (court.id === 'court-004') {
    return {
      courtId: court.id,
      weekdayOpen: '10:00',
      weekdayClose: '18:00',
      weekendOpen: '10:00',
      weekendClose: '16:00',
      isOpen: true,
    };
  }

  if (court.id === 'court-008') {
    return {
      courtId: court.id,
      weekdayOpen: '08:00',
      weekdayClose: '22:00',
      weekendOpen: '09:00',
      weekendClose: '21:00',
      isOpen: false,
    };
  }

  return {
    courtId: court.id,
    weekdayOpen: '08:00',
    weekdayClose: '22:00',
    weekendOpen: '09:00',
    weekendClose: '21:00',
    isOpen: true,
  };
});

export const scheduleExceptions: ScheduleException[] = [
  {
    id: 'exc-001',
    courtId: 'court-001',
    date: '2026-03-25',
    reason: 'Festivo local',
    isClosed: true,
  },
  {
    id: 'exc-002',
    courtId: 'court-003',
    date: '2026-03-21',
    reason: 'Torneo especial',
    isClosed: false,
    openTime: '07:00',
    closeTime: '23:00',
  },
  {
    id: 'exc-003',
    courtId: 'court-005',
    date: '2026-03-22',
    reason: 'Mantenimiento preventivo',
    isClosed: true,
  },
  {
    id: 'exc-004',
    courtId: 'court-007',
    date: '2026-03-20',
    reason: 'Evento privado',
    isClosed: false,
    openTime: '14:00',
    closeTime: '20:00',
  },
];
