import type { MatchFormat } from './match';

export interface KPIData {
  matchesToday: number;
  matchesTodayTrend: number; // percentage vs yesterday
  activePlayers: number;
  activePlayersTrend: number;
  avgOccupancy: number;
  avgOccupancyTrend: number;
  popularFormat: MatchFormat;
  totalMatchesWeek: number;
  revenueToday: number;
  revenueTodayTrend: number;
  peakHour: string; // e.g. "18:00"
}

export interface DailyMatches {
  date: string;
  matches: number;
}

export interface HourlyHeatmap {
  day: number; // 0=Mon, 6=Sun
  hour: number; // 0-23
  value: number; // match count
}

export interface FormatDistribution {
  format: MatchFormat;
  count: number;
  percentage: number;
}

export interface CourtOccupancy {
  courtId: string;
  courtName: string;
  occupancy: number; // 0-100
  matchesToday: number;
}

export interface RecentMatch {
  id: string;
  courtName: string;
  format: MatchFormat;
  scoreA: number;
  scoreB: number;
  time: string;
}
