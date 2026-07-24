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
import { reservations } from './mock/reservations';
import { gyms } from './mock/gyms';
import { users } from './mock/users';
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
  fbCreateCourt, fbUpdateCourt, fbDeleteCourt,
  fbGetCourtBlocks, fbCreateCourtBlock, fbDeleteCourtBlock,
  fbGetCourtIncidents, fbCreateCourtIncident, fbUpdateCourtIncident,
} from './firebaseProvider';
import type {
  FirebaseCourtIncident,
  IncidentType, IncidentPriority, IncidentStatus,
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
    try { return await fbGetGyms(); } catch (e) { console.error('[Firebase] getGyms:', e); throw new Error('No se pudieron cargar los clubes'); }
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
    try { return await fbGetCourts(gymId); } catch (e) { console.error('[Firebase] getCourts:', e); throw new Error('No se pudieron cargar las canastas'); }
  }
  await delay();
  const ids = getGymCourtIds(gymId);
  return ids ? courts.filter((c) => ids.has(c.id)) : courts;
}

export async function createCourt(data: Omit<Court, 'id'>): Promise<Court> {
  if (USE_FIREBASE) {
    try { return await fbCreateCourt(data); } catch (e) { console.error('[Firebase] createCourt:', e); throw e; }
  }
  await delay();
  const newCourt: Court = { ...data, id: `court-${String(courts.length + 1).padStart(3, '0')}` };
  courts.push(newCourt);
  const gym = gyms.find((g) => g.id === data.gymId);
  if (gym) gym.courts.push(newCourt.id);
  addAuditEntry({ action: 'create', entity: 'court', entityId: newCourt.id, description: `Creo canasta "${newCourt.name}"` });
  return newCourt;
}

export async function updateCourt(id: string, data: Partial<Court>): Promise<Court> {
  if (USE_FIREBASE) {
    try {
      await fbUpdateCourt(id, data);
      // Re-fetch to get the updated court
      const updatedCourts = await fbGetCourts();
      const updated = updatedCourts.find(c => c.id === id);
      if (updated) return updated;
    } catch (e) { console.error('[Firebase] updateCourt:', e); throw e; }
  }
  await delay();
  const idx = courts.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Court not found');
  courts[idx] = { ...courts[idx], ...data };
  addAuditEntry({ action: 'update', entity: 'court', entityId: id, description: `Actualizo canasta "${courts[idx].name}"` });
  return courts[idx];
}

export async function deleteCourt(id: string): Promise<void> {
  if (USE_FIREBASE) {
    await fbDeleteCourt(id);
    return;
  }
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
    try { return await fbGetMatches(filters); } catch (e) { console.error('[Firebase] getMatches:', e); throw new Error('No se pudieron cargar los partidos'); }
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

// ── Reservations ──

export async function getReservations(filters?: {
  courtId?: string;
  date?: string;
  status?: ReservationStatus;
  gymId?: string;
}): Promise<Reservation[]> {
  if (USE_FIREBASE) {
    try { return await fbGetReservations(filters); } catch (e) { console.error('[Firebase] getReservations:', e); throw new Error('No se pudieron cargar las reservas'); }
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The app's gym ids are Firebase slugs ('laieta'); Supabase gyms use uuid ids + a unique slug. */
async function getSupabaseGymRow(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const column = UUID_RE.test(id) ? 'id' : 'slug';
  const { data, error } = await supabase.from('gyms').select('*').eq(column, id).maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function getGymById(id: string): Promise<Gym | undefined> {
  if (USE_FIREBASE) {
    try {
      const base = await fbGetGymById(id);
      if (!base) return undefined;
      // Overlay del perfil editable guardado en Supabase (localizado por slug)
      const row = await getSupabaseGymRow(id);
      if (!row) return base;
      const overlay = mapSupabaseGym(row);
      return {
        ...base,
        name: overlay.name || base.name,
        address: overlay.address || base.address,
        city: overlay.city || base.city,
        phone: overlay.phone || base.phone,
        email: overlay.email || base.email,
        openingHours: (row.opening_hours as GymOpeningHours) ?? base.openingHours,
      };
    } catch (e) {
      console.error('[Firebase] getGymById:', e);
    }
  }
  if (isSupabaseConfigured && supabase) {
    const row = await getSupabaseGymRow(id);
    return row ? mapSupabaseGym(row) : undefined;
  }
  await delay();
  return gyms.find(g => g.id === id);
}

export async function updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
  const current = await getGymById(id);
  if (!current) throw new Error('Gym not found');

  if (isSupabaseConfigured && supabase) {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.address !== undefined) patch.address = data.address;
    if (data.city !== undefined) patch.city = data.city;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.email !== undefined) patch.email = data.email;
    if (data.openingHours !== undefined) patch.opening_hours = data.openingHours;

    if (Object.keys(patch).length > 0) {
      const column = UUID_RE.test(id) ? 'id' : 'slug';
      const { error } = await supabase.from('gyms').update(patch).eq(column, id);
      if (error) throw new Error(`Error guardando el perfil del club: ${error.message}`);
    }
    return { ...current, ...data };
  }

  // Mock (solo dev sin Supabase)
  await delay();
  const mockGym = gyms.find(g => g.id === id);
  if (mockGym) Object.assign(mockGym, data);
  return { ...current, ...data };
}

// ── Notifications ──
// Derivadas de datos reales (incidencias de Firestore + tickets de Supabase).
// El estado "leída" vive en localStorage: no hay tabla de notificaciones
// compatible con los gym ids tipo slug.

const NOTIF_READ_KEY = 'hoop-notifs-read';

function getReadNotifIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadNotifIds(ids: Set<string>): void {
  try {
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...ids]));
  } catch { /* storage lleno o bloqueado: no-op */ }
}

export async function getNotifications(gymId?: string): Promise<AppNotification[]> {
  if (!gymId) return [];
  const read = getReadNotifIds();
  const result: AppNotification[] = [];

  // Incidencias de pista abiertas (Firebase)
  try {
    const incidents = await getIncidents();
    for (const inc of incidents) {
      if (inc.status === 'resolved') continue;
      result.push({
        id: `inc-${inc.id}`,
        gymId,
        type: 'maintenance_alert',
        title: `Incidencia: ${inc.title}`,
        message: inc.description || 'Incidencia reportada en una canasta',
        read: read.has(`inc-${inc.id}`),
        createdAt: inc.createdAt,
      });
    }
  } catch (e) {
    console.error('[Notifications] incidents:', e);
  }

  // Tickets de mantenimiento (Supabase)
  try {
    const { tickets } = await getMaintenanceTickets(gymId);
    for (const t of tickets) {
      if (t.status === 'resolved' || t.status === 'closed') continue;
      const isCritical = t.priority === 'critical';
      result.push({
        id: `ticket-${t.id}`,
        gymId,
        type: isCritical ? 'system_alert' : 'maintenance_alert',
        title: isCritical ? `Ticket critico: ${t.title}` : `Ticket abierto: ${t.title}`,
        message: t.hoopStatus ? `Estado Hoop: ${t.hoopStatus}` : t.description || 'Ticket de mantenimiento abierto',
        read: read.has(`ticket-${t.id}`),
        createdAt: t.createdAt,
      });
    }
  } catch (e) {
    console.error('[Notifications] tickets:', e);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationRead(id: string): Promise<void> {
  const read = getReadNotifIds();
  read.add(id);
  saveReadNotifIds(read);
}

export async function markAllNotificationsRead(gymId: string): Promise<void> {
  const all = await getNotifications(gymId);
  const read = getReadNotifIds();
  all.forEach(n => read.add(n.id));
  saveReadNotifIds(read);
}

export async function getUnreadNotificationCount(gymId: string): Promise<number> {
  const all = await getNotifications(gymId);
  return all.filter(n => !n.read).length;
}

// ── Maintenance ──

import type { MaintenanceLog, TicketPriority, TicketStatus, MaintenanceAction } from '../types/maintenance';
import type { MaintenanceTicketWithHoop, HoopTicketStatus } from '../types/maintenance-hoop';

function mapTicketRow(row: Record<string, unknown>): MaintenanceTicketWithHoop {
  return {
    id: row.id as string,
    courtId: row.court_id as string,
    gymId: row.gym_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    assignedTo: (row.assigned_to as string) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
    hoopStatus: (row.hoop_status as HoopTicketStatus) ?? null,
    hoopAssignedTo: (row.hoop_assigned_to as string) ?? null,
    hoopNotes: (row.hoop_notes as string) ?? null,
    notifiedAt: (row.notified_at as string) ?? null,
  };
}

function mapLogRow(row: Record<string, unknown>): MaintenanceLog {
  return {
    id: row.id as string,
    ticketId: row.ticket_id as string,
    action: row.action as MaintenanceAction,
    userId: row.user_id as string,
    comment: (row.comment as string) ?? null,
    timestamp: row.timestamp as string,
  };
}

export async function getMaintenanceTickets(gymId: string): Promise<{ tickets: MaintenanceTicketWithHoop[]; logs: MaintenanceLog[] }> {
  if (isSupabaseConfigured && supabase) {
    const { data: ticketRows, error } = await supabase
      .from('maintenance_tickets')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Error cargando incidencias: ${error.message}`);
    const tickets = (ticketRows ?? []).map(mapTicketRow);

    let logs: MaintenanceLog[] = [];
    if (tickets.length > 0) {
      const { data: logRows, error: logError } = await supabase
        .from('maintenance_logs')
        .select('*')
        .in('ticket_id', tickets.map(t => t.id))
        .order('timestamp', { ascending: true });
      if (logError) throw new Error(`Error cargando historial: ${logError.message}`);
      logs = (logRows ?? []).map(mapLogRow);
    }
    return { tickets, logs };
  }
  await delay();
  const tickets = maintenanceTickets.filter(t => t.gymId === gymId);
  const ticketIds = new Set(tickets.map(t => t.id));
  const logs = maintenanceLogs.filter(l => ticketIds.has(l.ticketId));
  return { tickets, logs };
}

export interface CreateMaintenanceTicketPayload {
  courtId: string;
  gymId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  createdBy: string;
  assignedTo?: string | null;
  hoopStatus?: HoopTicketStatus | null;
  notifiedAt?: string | null;
}

export async function createMaintenanceTicket(data: CreateMaintenanceTicketPayload): Promise<MaintenanceTicketWithHoop> {
  if (isSupabaseConfigured && supabase) {
    const { data: row, error } = await supabase
      .from('maintenance_tickets')
      .insert({
        court_id: data.courtId,
        gym_id: data.gymId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        created_by: data.createdBy,
        assigned_to: data.assignedTo ?? null,
        hoop_status: data.hoopStatus ?? null,
        notified_at: data.notifiedAt ?? null,
      })
      .select()
      .single();
    if (error || !row) throw new Error(`Error creando incidencia: ${error?.message ?? 'sin datos'}`);

    await supabase.from('maintenance_logs').insert({
      ticket_id: row.id,
      action: 'created',
      user_id: data.createdBy,
      comment: null,
    });

    return mapTicketRow(row as Record<string, unknown>);
  }
  // Mock (solo dev sin Supabase): objeto local no persistente
  await delay();
  const now = new Date().toISOString();
  const ticket: MaintenanceTicketWithHoop = {
    id: `maint-${Date.now()}`,
    courtId: data.courtId,
    gymId: data.gymId,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: 'open',
    assignedTo: data.assignedTo ?? null,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    hoopStatus: data.hoopStatus ?? null,
    hoopAssignedTo: null,
    hoopNotes: null,
    notifiedAt: data.notifiedAt ?? null,
  };
  maintenanceTickets.unshift(ticket);
  return ticket;
}

export async function updateMaintenanceTicketStatus(id: string, status: TicketStatus, userId: string): Promise<void> {
  const resolvedAt = status === 'resolved' || status === 'closed' ? new Date().toISOString() : null;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('maintenance_tickets')
      .update({ status, resolved_at: resolvedAt })
      .eq('id', id);
    if (error) throw new Error(`Error actualizando incidencia: ${error.message}`);
    await supabase.from('maintenance_logs').insert({
      ticket_id: id,
      action: 'status_changed',
      user_id: userId,
      comment: `Estado cambiado a ${status}`,
    });
    return;
  }
  await delay();
  const ticket = maintenanceTickets.find(t => t.id === id);
  if (ticket) {
    ticket.status = status;
    ticket.resolvedAt = resolvedAt;
    ticket.updatedAt = new Date().toISOString();
  }
}

export async function addMaintenanceComment(ticketId: string, userId: string, comment: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('maintenance_logs').insert({
      ticket_id: ticketId,
      action: 'commented',
      user_id: userId,
      comment,
    });
    if (error) throw new Error(`Error guardando comentario: ${error.message}`);
    return;
  }
  await delay();
  maintenanceLogs.push({
    id: `log-${Date.now()}`,
    ticketId,
    action: 'commented',
    userId,
    comment,
    timestamp: new Date().toISOString(),
  });
}

export async function getMaintenanceStats(gymId: string): Promise<{
  open: number;
  critical: number;
  avgResolutionHours: number;
  resolvedThisMonth: number;
}> {
  const { tickets } = await getMaintenanceTickets(gymId);
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
    } catch (e) { console.error('[Firebase] getStatsOverview:', e); throw new Error('No se pudieron cargar las estadisticas'); }
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
    } catch (e) { console.error('[Firebase] getDailyStats:', e); throw new Error('No se pudieron cargar las estadisticas diarias'); }
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

// ── Court Slots (backed by Firebase court_blocks) ──

export async function getCourtSlots(courtId: string, date: string): Promise<CourtSlot[]> {
  if (USE_FIREBASE) {
    try {
      const blocks = await fbGetCourtBlocks(courtId, date);
      return blocks.map(b => ({
        id: b.id,
        courtId: b.courtId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: 'blocked' as const,
        createdAt: b.createdAt,
      }));
    } catch (e) { console.error('[Firebase] getCourtSlots:', e); throw new Error('No se pudieron cargar las franjas'); }
  }
  await delay();
  return courtSlotsData.filter((s) => s.courtId === courtId && s.date === date);
}

export async function createCourtSlot(data: Omit<CourtSlot, 'id' | 'createdAt'>): Promise<CourtSlot> {
  if (USE_FIREBASE) {
    try {
      const block = await fbCreateCourtBlock({
        courtId: data.courtId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      });
      return {
        id: block.id,
        courtId: block.courtId,
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        status: 'blocked',
        createdAt: block.createdAt,
      };
    } catch (e) { console.error('[Firebase] createCourtSlot:', e); throw e; }
  }
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
  if (USE_FIREBASE && data.status === 'available') {
    // "Unblock" = delete the block from Firebase
    try {
      await fbDeleteCourtBlock(id);
      return { id, courtId: '', date: '', startTime: '', endTime: '', status: 'available', createdAt: '' };
    } catch (e) { console.error('[Firebase] updateCourtSlot:', e); throw e; }
  }
  await delay();
  const idx = courtSlotsData.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Court slot not found');
  courtSlotsData[idx] = { ...courtSlotsData[idx], ...data };
  return courtSlotsData[idx];
}

export async function deleteCourtSlot(id: string): Promise<void> {
  if (USE_FIREBASE) {
    try { await fbDeleteCourtBlock(id); return; } catch (e) { console.error('[Firebase] deleteCourtSlot:', e); throw e; }
  }
  await delay();
  const idx = courtSlotsData.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Court slot not found');
  courtSlotsData.splice(idx, 1);
}

// ── Incidents (backed by Firebase court_incidents) ──

export { type FirebaseCourtIncident, type IncidentType, type IncidentPriority, type IncidentStatus } from './firebaseProvider';

export async function getIncidents(courtId?: string): Promise<FirebaseCourtIncident[]> {
  if (USE_FIREBASE) {
    try { return await fbGetCourtIncidents(courtId); } catch (e) { console.error('[Firebase] getIncidents:', e); throw new Error('No se pudieron cargar las incidencias'); }
  }
  return [];
}

export async function createIncident(data: {
  courtId: string;
  reservationId?: string;
  type: IncidentType;
  title: string;
  description: string;
  priority: IncidentPriority;
}): Promise<FirebaseCourtIncident> {
  if (USE_FIREBASE) {
    return await fbCreateCourtIncident(data);
  }
  throw new Error('Firebase not configured');
}

export async function updateIncident(id: string, data: { status?: IncidentStatus; resolvedBy?: string }): Promise<void> {
  if (USE_FIREBASE) {
    return await fbUpdateCourtIncident(id, data);
  }
  throw new Error('Firebase not configured');
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
    try { return await fbGetClubMembers(gymId); } catch (e) { console.error('[Firebase] getClubMembers:', e); throw new Error('No se pudieron cargar los miembros'); }
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

// ── Invite Gestor ──

/** Headers for calls to the /api/* serverless endpoints: JSON + Supabase JWT. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface InviteGestorPayload {
  email: string;
  name: string;
  role: 'admin' | 'gestor' | 'staff';
  gymIds: string[];
  password: string;
}

export interface InviteGestorResult {
  id: string;
  email: string;
  name: string;
  role: string;
  gymIds: string[];
}

/**
 * Calls the `invite-gestor` Edge Function to create a new dashboard user.
 * The Edge Function uses the service_role key to bypass auth.users restrictions
 * and sets email_confirm: true so the new user can sign in immediately.
 *
 * @throws Error with a human-readable Spanish message on failure.
 */
export async function inviteGestor(data: InviteGestorPayload): Promise<InviteGestorResult> {
  const res = await fetch('/api/invite-gestor', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok || result.error) {
    throw new Error(result.error ?? 'Error al invitar gestor');
  }

  if (!result.user) {
    throw new Error('El servidor no devolvio los datos del usuario');
  }

  return result.user;
}

export async function deleteGestor(userId: string): Promise<void> {
  const res = await fetch('/api/delete-gestor', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ userId }),
  });
  const result = await res.json();
  if (!res.ok || result.error) throw new Error(result.error ?? 'Error al eliminar gestor');
}

export async function updateGestorRole(userId: string, role: string, gymIds?: string[]): Promise<void> {
  const res = await fetch('/api/update-gestor', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ userId, role, gymIds }),
  });
  const result = await res.json();
  if (!res.ok || result.error) throw new Error(result.error ?? 'Error al actualizar gestor');
}

