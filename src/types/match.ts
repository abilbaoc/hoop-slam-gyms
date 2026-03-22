export type MatchFormat = '1v1' | '2v2' | '3v3';

export interface Match {
  id: string;
  courtId: string;
  format: MatchFormat;
  scoreA: number;
  scoreB: number;
  duration: number; // 10, 20, or 30 minutes
  startedAt: string; // ISO datetime
  endedAt: string;
  playerCount: number; // 2, 4, or 6
}
