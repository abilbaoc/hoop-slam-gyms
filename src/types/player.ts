import type { MatchFormat } from './match';

export type RecurrenceLevel = 'diario' | 'semanal' | 'mensual' | 'inactivo';

export interface Player {
  id: string;
  gymId: string;
  name: string;
  initials: string;
  elo: number;
  level: string; // Basico, Intermedio, Avanzado, Experto
  matchesPlayed: number;
  wins: number;
  losses: number;
  preferredFormat: MatchFormat;
  lastPlayedAt: string;
  recurrence: RecurrenceLevel;
  joinedAt: string;
}
