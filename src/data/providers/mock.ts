import type { DataProvider } from '../provider';
import * as api from '../api';

// The mock provider delegates to the existing api.ts functions
// which use in-memory mock data with simulated delays.
export const mockProvider: DataProvider = {
  getGyms: api.getGyms,
  getCourts: api.getCourts,
  createCourt: api.createCourt,
  updateCourt: api.updateCourt,
  deleteCourt: api.deleteCourt,
  getMatches: api.getMatches,
  getPlayers: api.getPlayers,
  getKPIs: api.getKPIs,
  getDailyMatchesData: api.getDailyMatchesData,
  getHourlyHeatmapData: api.getHourlyHeatmapData,
  getFormatDistributionData: api.getFormatDistributionData,
  getCourtOccupancyData: api.getCourtOccupancyData,
  getRecentMatchesData: api.getRecentMatchesData,
  getSchedules: api.getSchedules,
  getScheduleExceptions: api.getScheduleExceptions,
  updateSchedule: api.updateSchedule,
  createException: api.createException,
  deleteException: api.deleteException,
  getPricingRules: api.getPricingRules,
  createPricingRule: api.createPricingRule,
  updatePricingRule: api.updatePricingRule,
  deletePricingRule: api.deletePricingRule,
  getPromos: api.getPromos,
  createPromo: api.createPromo,
  updatePromo: api.updatePromo,
  deletePromo: api.deletePromo,
  getReservations: api.getReservations,
  createReservation: api.createReservation,
  cancelReservation: api.cancelReservation,
  blockSlot: api.blockSlot,
  getAuditEntries: api.getAuditEntries,
};
