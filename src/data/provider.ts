import type {
  Court,
  Match,
  MatchFormat,
  Player,
  KPIData,
  DailyMatches,
  HourlyHeatmap,
  FormatDistribution,
  CourtOccupancy,
  RecentMatch,
  CourtSchedule,
  ScheduleException,
  PricingRule,
  Promo,
  Reservation,
  ReservationStatus,
  AuditEntry,
} from '../types';
import type { Gym } from '../types/gym';

export interface DataProvider {
  // Gyms
  getGyms(): Promise<Gym[]>;

  // Courts
  getCourts(gymId?: string): Promise<Court[]>;
  createCourt(data: Omit<Court, 'id'>): Promise<Court>;
  updateCourt(id: string, data: Partial<Court>): Promise<Court>;
  deleteCourt(id: string): Promise<void>;

  // Matches
  getMatches(filters?: { courtId?: string; format?: MatchFormat; days?: number; gymId?: string }): Promise<Match[]>;

  // Players
  getPlayers(): Promise<Player[]>;

  // Analytics
  getKPIs(gymId?: string): Promise<KPIData>;
  getDailyMatchesData(days?: number, gymId?: string): Promise<DailyMatches[]>;
  getHourlyHeatmapData(gymId?: string): Promise<HourlyHeatmap[]>;
  getFormatDistributionData(gymId?: string): Promise<FormatDistribution[]>;
  getCourtOccupancyData(gymId?: string): Promise<CourtOccupancy[]>;
  getRecentMatchesData(limit?: number, gymId?: string): Promise<RecentMatch[]>;

  // Schedules
  getSchedules(gymId?: string): Promise<CourtSchedule[]>;
  getScheduleExceptions(gymId?: string): Promise<ScheduleException[]>;
  updateSchedule(courtId: string, data: Partial<CourtSchedule>): Promise<CourtSchedule>;
  createException(data: Omit<ScheduleException, 'id'>): Promise<ScheduleException>;
  deleteException(id: string): Promise<void>;

  // Pricing
  getPricingRules(): Promise<PricingRule[]>;
  createPricingRule(data: Omit<PricingRule, 'id'>): Promise<PricingRule>;
  updatePricingRule(id: string, data: Partial<PricingRule>): Promise<PricingRule>;
  deletePricingRule(id: string): Promise<void>;

  // Promos
  getPromos(): Promise<Promo[]>;
  createPromo(data: Omit<Promo, 'id'>): Promise<Promo>;
  updatePromo(id: string, data: Partial<Promo>): Promise<Promo>;
  deletePromo(id: string): Promise<void>;

  // Reservations
  getReservations(filters?: { courtId?: string; date?: string; status?: ReservationStatus; gymId?: string }): Promise<Reservation[]>;
  createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation>;
  cancelReservation(id: string): Promise<void>;
  blockSlot(data: { courtId: string; date: string; startTime: string; endTime: string; reason: string }): Promise<Reservation>;

  // Audit
  getAuditEntries(): Promise<AuditEntry[]>;
}
