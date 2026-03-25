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
import type { AppUser } from '../types/auth';
import type { UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import type { AppNotification } from '../types/notification';

import { courts } from './mock/courts';
import { matches } from './mock/matches';
import { players } from './mock/players';
import {
  getKPIs as computeKPIs,
  getDailyMatches as computeDailyMatches,
  getHourlyHeatmap as computeHourlyHeatmap,
  getFormatDistribution as computeFormatDistribution,
  getCourtOccupancy as computeCourtOccupancy,
  getRecentMatches as computeRecentMatches,
} from './mock/generators';
import { schedules, scheduleExceptions } from './mock/schedules';
import { pricingRules, promos } from './mock/pricing';
import { reservations } from './mock/reservations';
import { gyms } from './mock/gyms';
import { users } from './mock/users';
import { notifications } from './mock/notifications';
import { getAuditLog, addAuditEntry } from './mock/audit';
import { maintenanceTicketsWithHoop as maintenanceTickets, maintenanceLogs } from './mock/maintenance-hoop';
import type { CourtSlot } from '../types/slot';
import type { ClubMember } from '../types/club_member';
import type { StatsOverview, DailyStats } from '../types/stats';
import { courtSlots as courtSlotsData } from './mock/court_slots';
import { clubMembers as clubMembersData } from './mock/club_members';
import { isFirebaseConfigured } from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { GymOpeningHours } from '../types/gym';
import {
  fbGetGyms, fbGetGymById, fbGetCourts,
  fbGetMatches, fbGetReservations,
  fbGetClubMembers, fbGetStatsOverview, fbGetDailyStats,
} from './firebaseProvider';

const USE_FIREBASE = import.meta.env.VITE_DATA_SOURCE === 'firebase' && isFirebaseConfigured;

function delay(): Promise<void> {
  const ms = 50 + Math.random() * 100;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGymCourtIds(gymId?: string): Set<string> | null {
  if (!gymId) return null;
  const gym = gyms.find((g) => g.id === gymId);
  return gym ? new Set(gym.courts) : null;
}

// ── Gyms ──

function mapSupabaseGym(row: Record<string, unknown>): Gym {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) ?? '',
    address: (row.address as string) ?? '',
    city: (row.city as string) ?? '',
    timezone: (row.timezone as string) ?? 'Europe/Madrid',
    phone: (row.phone as string) ?? '',
    email: (row.email as string) ?? '',
    openingHours: (row.opening_hours as GymOpeningHours) ?? {
      weekdayOpen: '09:00', weekdayClose: '21:00',
      weekendOpen: '10:00', weekendClose: '20:00',
    },
    courts: [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export async function getGyms(): Promise<Gym[]> {
  if (USE_FIREBASE) {
    try { return await fbGetGyms(); } catch (e) { console.error('[Firebase] getGyms:', e); }
  }
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('gyms').select('*').order('created_at');
    if (!error && data) return data.map(mapSupabaseGym);
  }
  await delay();
  return gyms;
}

// ── Courts ──

export async function getCourts(gymId?: string): Promise<Court[]> {
  if (USE_FIREBASE) {
    try { return await fbGetCourts(gymId); } catch (e) { console.error('[Firebase] getCourts:', e); }
  }
  await delay();
  const ids = getGymCourtIds(gymId);
  return ids ? courts.filter((c) => ids.has(c.id)) : courts;
}

export async function createCourt(data: Omit<Court, 'id'>): Promise<Court> {
  await delay();
  const newCourt: Court = { ...data, id: `court-${String(courts.length + 1).padStart(3, '0')}` };
  courts.push(newCourt);
  const gym = gyms.find((g) => g.id === data.gymId);
  if (gym) gym.courts.push(newCourt.id);
  addAuditEntry({ action: 'create', entity: 'court', entityId: newCourt.id, description: `Creo canasta "${newCourt.name}"` });
  return newCourt;
}

export async function updateCourt(id: string, data: Partial<Court>): Promise<Court> {
  await delay();
  const idx = courts.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Court not found');
  courts[idx] = { ...courts[idx], ...data };
  addAuditEntry({ action: 'update', entity: 'court', entityId: id, description: `Actualizo canasta "${courts[idx].name}"` });
  return courts[idx];
}

export async function deleteCourt(id: string): Promise<void> {
  await delay();
  const court = courts.find((c) => c.id === id);
  const idx = courts.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Court not found');
  courts.splice(idx, 1);
  addAuditEntry({ action: 'delete', entity: 'court', entityId: id, description: `Elimino canasta "${court?.name}"` });
}

// ── Matches ──

export async function getMatches(filters?: {
  courtId?: string;
  format?: MatchFormat;
  days?: number;
  gymId?: string;
}): Promise<Match[]> {
  if (USE_FIREBASE) {
    try { return await fbGetMatches(filters); } catch (e) { console.error('[Firebase] getMatches:', e); }
  }
  await delay();
  let result = matches;
  const ids = getGymCourtIds(filters?.gymId);
  if (ids) result = result.filter((m) => ids.has(m.courtId));
  if (filters?.courtId) result = result.filter((m) => m.courtId === filters.courtId);
  if (filters?.format) result = result.filter((m) => m.format === filters.format);
  if (filters?.days) {
    const cutoff = new Date(Date.now() - filters.days * 86400000).toISOString();
    result = result.filter((m) => m.startedAt >= cutoff);
  }
  return result;
}

// ── Players ──

export async function getPlayers(gymId?: string): Promise<Player[]> {
  await delay();
  if (!gymId) return players;
  return players.filter((p) => p.gymId === gymId);
}

// ── Analytics ──

export async function getKPIs(gymId?: string): Promise<KPIData> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fc = ids ? courts.filter((c) => ids.has(c.id)) : courts;
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeKPIs(fm, fc, players);
}

export async function getDailyMatchesData(days?: number, gymId?: string): Promise<DailyMatches[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeDailyMatches(fm, days);
}

export async function getHourlyHeatmapData(gymId?: string): Promise<HourlyHeatmap[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeHourlyHeatmap(fm);
}

export async function getFormatDistributionData(gymId?: string): Promise<FormatDistribution[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeFormatDistribution(fm);
}

export async function getCourtOccupancyData(gymId?: string): Promise<CourtOccupancy[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fc = ids ? courts.filter((c) => ids.has(c.id)) : courts;
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeCourtOccupancy(fm, fc);
}

export async function getRecentMatchesData(limit?: number, gymId?: string): Promise<RecentMatch[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  const fc = ids ? courts.filter((c) => ids.has(c.id)) : courts;
  const fm = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  return computeRecentMatches(fm, fc, limit);
}

// ── Schedules ──

export async function getSchedules(gymId?: string): Promise<CourtSchedule[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  return ids ? schedules.filter((s) => ids.has(s.courtId)) : schedules;
}

export async function getScheduleExceptions(gymId?: string): Promise<ScheduleException[]> {
  await delay();
  const ids = getGymCourtIds(gymId);
  return ids ? scheduleExceptions.filter((e) => ids.has(e.courtId)) : scheduleExceptions;
}

export async function updateSchedule(courtId: string, data: Partial<CourtSchedule>): Promise<CourtSchedule> {
  await delay();
  const idx = schedules.findIndex((s) => s.courtId === courtId);
  if (idx === -1) throw new Error('Schedule not found');
  schedules[idx] = { ...schedules[idx], ...data };
  addAuditEntry({ action: 'update', entity: 'schedule', entityId: courtId, description: `Actualizo horario de canasta` });
  return schedules[idx];
}

export async function createException(data: Omit<ScheduleException, 'id'>): Promise<ScheduleException> {
  await delay();
  const exc: ScheduleException = { ...data, id: `exc-${String(scheduleExceptions.length + 1).padStart(3, '0')}` };
  scheduleExceptions.push(exc);
  addAuditEntry({ action: 'create', entity: 'schedule', entityId: exc.id, description: `Creo excepcion: ${data.reason}` });
  return exc;
}

export async function deleteException(id: string): Promise<void> {
  await delay();
  const idx = scheduleExceptions.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Exception not found');
  scheduleExceptions.splice(idx, 1);
  addAuditEntry({ action: 'delete', entity: 'schedule', entityId: id, description: `Elimino excepcion de horario` });
}

// ── Pricing ──

export async function getPricingRules(gymId?: string): Promise<PricingRule[]> {
  await delay();
  if (!gymId) return pricingRules;
  return pricingRules.filter((r) => r.gymId === gymId);
}

export async function createPricingRule(data: Omit<PricingRule, 'id'>): Promise<PricingRule> {
  await delay();
  const rule: PricingRule = { ...data, id: `price-${String(pricingRules.length + 1).padStart(3, '0')}` };
  pricingRules.push(rule);
  addAuditEntry({ action: 'create', entity: 'pricing', entityId: rule.id, description: `Creo regla de precio "${rule.name}"` });
  return rule;
}

export async function updatePricingRule(id: string, data: Partial<PricingRule>): Promise<PricingRule> {
  await delay();
  const idx = pricingRules.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Pricing rule not found');
  pricingRules[idx] = { ...pricingRules[idx], ...data };
  addAuditEntry({ action: 'update', entity: 'pricing', entityId: id, description: `Actualizo regla "${pricingRules[idx].name}"` });
  return pricingRules[idx];
}

export async function deletePricingRule(id: string): Promise<void> {
  await delay();
  const idx = pricingRules.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Pricing rule not found');
  pricingRules.splice(idx, 1);
  addAuditEntry({ action: 'delete', entity: 'pricing', entityId: id, description: `Elimino regla de precio` });
}

// ── Promos ──

export async function getPromos(gymId?: string): Promise<Promo[]> {
  await delay();
  if (!gymId) return promos;
  return promos.filter((p) => p.gymId === gymId);
}

export async function createPromo(data: Omit<Promo, 'id'>): Promise<Promo> {
  await delay();
  const promo: Promo = { ...data, id: `promo-${String(promos.length + 1).padStart(3, '0')}` };
  promos.push(promo);
  addAuditEntry({ action: 'create', entity: 'promo', entityId: promo.id, description: `Creo promo "${promo.name}"` });
  return promo;
}

export async function updatePromo(id: string, data: Partial<Promo>): Promise<Promo> {
  await delay();
  const idx = promos.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Promo not found');
  promos[idx] = { ...promos[idx], ...data };
  addAuditEntry({ action: 'update', entity: 'promo', entityId: id, description: `Actualizo promo "${promos[idx].name}"` });
  return promos[idx];
}

export async function deletePromo(id: string): Promise<void> {
  await delay();
  const idx = promos.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Promo not found');
  promos.splice(idx, 1);
  addAuditEntry({ action: 'delete', entity: 'promo', entityId: id, description: `Elimino promo` });
}

// ── Reservations ──

export async function getReservations(filters?: {
  courtId?: string;
  date?: string;
  status?: ReservationStatus;
  gymId?: string;
}): Promise<Reservation[]> {
  if (USE_FIREBASE) {
    try { return await fbGetReservations(filters); } catch (e) { console.error('[Firebase] getReservations:', e); }
  }
  await delay();
  let result = reservations;
  const ids = getGymCourtIds(filters?.gymId);
  if (ids) result = result.filter((r) => ids.has(r.courtId));
  if (filters?.courtId) result = result.filter((r) => r.courtId === filters.courtId);
  if (filters?.date) result = result.filter((r) => r.date === filters.date);
  if (filters?.status) result = result.filter((r) => r.status === filters.status);
  return result;
}

export async function createReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
  await delay();
  const res: Reservation = {
    ...data,
    id: `res-${String(reservations.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  };
  reservations.push(res);
  addAuditEntry({ action: 'create', entity: 'reservation', entityId: res.id, description: `Creo reserva para ${res.playerName}` });
  return res;
}

export async function cancelReservation(id: string): Promise<void> {
  await delay();
  const idx = reservations.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Reservation not found');
  reservations[idx] = { ...reservations[idx], status: 'cancelled' };
  addAuditEntry({ action: 'update', entity: 'reservation', entityId: id, description: `Cancelo reserva de ${reservations[idx].playerName}` });
}

export async function blockSlot(data: {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<Reservation> {
  await delay();
  const res: Reservation = {
    id: `res-block-${String(reservations.length + 1).padStart(3, '0')}`,
    courtId: data.courtId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    playerName: data.reason,
    format: '1v1',
    status: 'blocked',
    createdAt: new Date().toISOString(),
  };
  reservations.push(res);
  addAuditEntry({ action: 'create', entity: 'reservation', entityId: res.id, description: `Bloqueo franja ${data.startTime}-${data.endTime}: ${data.reason}` });
  return res;
}

// ── Audit ──

export async function getAuditEntries(gymId?: string): Promise<AuditEntry[]> {
  await delay();
  return getAuditLog(gymId);
}

// ── Users ──

export async function getUsers(gymId?: string): Promise<AppUser[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('profiles').select('*');
    if (gymId) query = query.filter('gym_ids', 'cs', `{${gymId}}`);
    const { data, error } = await query;
    if (!error && data) return data.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: (p.name as string) || '',
      email: (p.email as string) || '',
      role: (p.role as UserRole) || 'staff',
      gymIds: (p.gym_ids as string[]) || [],
      permissions: ROLE_PERMISSIONS[(p.role as UserRole) || 'staff'],
      lastActiveAt: new Date().toISOString(),
      avatarInitials: ((p.name as string) || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
    }));
  }
  await delay();
  if (!gymId) return users;
  return users.filter(u => u.gymIds.includes(gymId));
}

export async function getGymById(id: string): Promise<Gym | undefined> {
  if (USE_FIREBASE) {
    try { return await fbGetGymById(id); } catch (e) { console.error('[Firebase] getGymById:', e); }
  }
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
    if (!error && data) return mapSupabaseGym(data as Record<string, unknown>);
    return undefined;
  }
  await delay();
  return gyms.find(g => g.id === id);
}

export async function updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
  if (isSupabaseConfigured && supabase) {
    const { data: updated, error } = await supabase
      .from('gyms')
      .update({ name: data.name, city: data.city, address: data.address })
      .eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapSupabaseGym(updated as Record<string, unknown>);
  }
  await delay();
  const idx = gyms.findIndex(g => g.id === id);
  if (idx === -1) throw new Error('Gym not found');
  gyms[idx] = { ...gyms[idx], ...data };
  return gyms[idx];
}

// ── Notifications ──

export async function getNotifications(gymId?: string): Promise<AppNotification[]> {
  await delay();
  let result = notifications;
  if (gymId) result = result.filter(n => n.gymId === gymId);
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay();
  const n = notifications.find(n => n.id === id);
  if (n) n.read = true;
}

export async function markAllNotificationsRead(gymId: string): Promise<void> {
  await delay();
  notifications.filter(n => n.gymId === gymId).forEach(n => n.read = true);
}

export async function getUnreadNotificationCount(gymId: string): Promise<number> {
  await delay();
  return notifications.filter(n => n.gymId === gymId && !n.read).length;
}

// ── Maintenance ──

import type { MaintenanceLog } from '../types/maintenance';
import type { MaintenanceTicketWithHoop } from '../types/maintenance-hoop';

export async function getMaintenanceTickets(gymId: string): Promise<{ tickets: MaintenanceTicketWithHoop[]; logs: MaintenanceLog[] }> {
  await delay();
  const tickets = maintenanceTickets.filter(t => t.gymId === gymId);
  const ticketIds = new Set(tickets.map(t => t.id));
  const logs = maintenanceLogs.filter(l => ticketIds.has(l.ticketId));
  return { tickets, logs };
}

export async function getMaintenanceStats(gymId: string): Promise<{
  open: number;
  critical: number;
  avgResolutionHours: number;
  resolvedThisMonth: number;
}> {
  await delay();
  const tickets = maintenanceTickets.filter(t => t.gymId === gymId);
  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length;
  const resolved = tickets.filter(t => t.resolvedAt);
  const avgMs = resolved.length > 0
    ? resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()), 0) / resolved.length
    : 0;
  const avgResolutionHours = Math.round(avgMs / (1000 * 60 * 60));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const resolvedThisMonth = tickets.filter(t => t.resolvedAt && t.resolvedAt >= monthStart).length;
  return { open, critical, avgResolutionHours, resolvedThisMonth };
}

// ── Stats (new scope) ──

export async function getStatsOverview(gymId: string): Promise<StatsOverview> {
  if (USE_FIREBASE) {
    try {
      const courtIds = (await fbGetCourts(gymId)).map(c => c.id);
      return await fbGetStatsOverview(gymId, courtIds);
    } catch (e) { console.error('[Firebase] getStatsOverview:', e); }
  }
  await delay();
  const ids = getGymCourtIds(gymId);
  const gymReservations = ids ? reservations.filter((r) => ids.has(r.courtId)) : reservations;
  const gymMatches = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  const now = new Date();
  return {
    reservas_hechas: gymReservations.filter((r) => r.status === 'confirmed').length,
    reservas_iniciadas: gymReservations.filter((r) => {
      if (r.status !== 'confirmed') return false;
      return new Date(`${r.date}T${r.startTime}`) <= now;
    }).length,
    reservas_canceladas: gymReservations.filter((r) => r.status === 'cancelled').length,
    partidos_jugados: gymMatches.length,
    partidos_cancelados: 0,
  };
}

export async function getDailyStats(gymId: string, days: number): Promise<DailyStats[]> {
  if (USE_FIREBASE) {
    try {
      const courtIds = (await fbGetCourts(gymId)).map(c => c.id);
      return await fbGetDailyStats(gymId, courtIds, days);
    } catch (e) { console.error('[Firebase] getDailyStats:', e); }
  }
  await delay();
  const ids = getGymCourtIds(gymId);
  const gymReservations = ids ? reservations.filter((r) => ids.has(r.courtId)) : reservations;
  const gymMatches = ids ? matches.filter((m) => ids.has(m.courtId)) : matches;
  const result: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      reservations: gymReservations.filter((r) => r.date === dateStr).length,
      matches: gymMatches.filter((m) => m.startedAt.slice(0, 10) === dateStr).length,
    });
  }
  return result;
}

// ── Court Slots ──

export async function getCourtSlots(courtId: string, date: string): Promise<CourtSlot[]> {
  await delay();
  return courtSlotsData.filter((s) => s.courtId === courtId && s.date === date);
}

export async function createCourtSlot(data: Omit<CourtSlot, 'id' | 'createdAt'>): Promise<CourtSlot> {
  await delay();
  const slot: CourtSlot = {
    ...data,
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  courtSlotsData.push(slot);
  return slot;
}

export async function updateCourtSlot(id: string, data: Partial<CourtSlot>): Promise<CourtSlot> {
  await delay();
  const idx = courtSlotsData.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Court slot not found');
  courtSlotsData[idx] = { ...courtSlotsData[idx], ...data };
  return courtSlotsData[idx];
}

export async function deleteCourtSlot(id: string): Promise<void> {
  await delay();
  const idx = courtSlotsData.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Court slot not found');
  courtSlotsData.splice(idx, 1);
}

export async function createGym(data: { name: string; city: string; address?: string }): Promise<Gym> {
  if (isSupabaseConfigured && supabase) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data: created, error } = await supabase
      .from('gyms')
      .insert({ name: data.name, city: data.city, address: data.address ?? '', slug, timezone: 'Europe/Madrid' })
      .select().single();
    if (error) throw new Error(error.message);
    return mapSupabaseGym(created as Record<string, unknown>);
  }
  await delay();
  const newGym: Gym = {
    id: `gym-${String(gyms.length + 1).padStart(3, '0')}`,
    name: data.name,
    slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    address: data.address ?? '',
    city: data.city,
    timezone: 'Europe/Madrid',
    phone: '',
    email: '',
    openingHours: { weekdayOpen: '09:00', weekdayClose: '21:00', weekendOpen: '10:00', weekendClose: '20:00' },
    courts: [],
    createdAt: new Date().toISOString(),
  };
  gyms.push(newGym);
  return newGym;
}

// ── Club Members ──

export async function getClubMembers(gymId: string): Promise<ClubMember[]> {
  if (USE_FIREBASE) {
    try { return await fbGetClubMembers(gymId); } catch (e) { console.error('[Firebase] getClubMembers:', e); }
  }
  await delay();
  return clubMembersData.filter((m) => m.gymId === gymId);
}

// ── Team (gym-scoped users) ──

export async function getTeamMembers(gymId: string): Promise<AppUser[]> {
  return getUsers(gymId);
}

export async function revokeTeamMember(userId: string, gymId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: profile } = await supabase.from('profiles').select('gym_ids').eq('id', userId).single();
    const newGymIds = (profile?.gym_ids ?? []).filter((id: string) => id !== gymId);
    await supabase.from('profiles').update({ gym_ids: newGymIds }).eq('id', userId);
    return;
  }
  // mock: no-op
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'gestor' | 'staff'): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    return;
  }
  // mock: no-op
}

