export type MatchFormat = '1v1' | '2v2' | '3v3';

export interface Match {
  id: string;
  courtId: string;
  courtName?: string;
  format: MatchFormat;
  scoreA: number;
  scoreB: number;
  duration: number; // minutes
  startedAt: string; // ISO datetime
  endedAt: string;
  playerCount: number;
  players?: string[]; // nicknames
}
