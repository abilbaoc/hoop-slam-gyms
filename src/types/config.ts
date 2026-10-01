import type { MatchFormat } from './match';

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
