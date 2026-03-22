import type { MatchFormat } from './match';

export interface CourtSchedule {
  courtId: string;
  weekdayOpen: string; // "08:00"
  weekdayClose: string; // "22:00"
  weekendOpen: string; // "09:00"
  weekendClose: string; // "21:00"
  isOpen: boolean;
}

export interface ScheduleException {
  id: string;
  courtId: string;
  date: string; // ISO date "2026-03-25"
  reason: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface PricingRule {
  id: string;
  gymId: string;
  name: string;
  type: 'base' | 'peak' | 'offpeak' | 'weekend';
  priceEur: number;
  startHour?: number;
  endHour?: number;
  daysOfWeek?: number[]; // 0=Mon..6=Sun
}

export interface Promo {
  id: string;
  gymId: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free';
  value: number;
  conditions: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'blocked';

export interface Reservation {
  id: string;
  courtId: string;
  date: string; // ISO date
  startTime: string; // "17:00"
  endTime: string; // "17:30"
  playerName: string;
  format: MatchFormat;
  status: ReservationStatus;
  createdAt: string;
}
