/**
 * Firebase Data Provider — mapped to real Firestore schema (hoopslam-a6c30)
 *
 * Collections in Firestore:
 *   courts (1+)   — basket/court documents
 *   reservations (92+) — bookings with embedded court & player data
 *   users (17+)   — player profiles
 *
 * No "gyms" collection exists yet — we synthesise a single Laietà gym.
 * No "matches" collection — finished reservations act as played matches.
 */

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, ensureFirebaseAuth } from '../lib/firebase';
import type { Gym } from '../types/gym';
import type { Court } from '../types';
import type { Match, MatchFormat } from '../types';
import type { Reservation, ReservationStatus } from '../types';
import type { ClubMember } from '../types/club_member';
import type { StatsOverview, DailyStats } from '../types/stats';

// ── Virtual gym — all courts belong to Laietà for now ─────────────────────
const LAIETA_GYM_ID = 'laieta';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert a Firestore timestamp-like value to ISO string. */
function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  // Firestore REST/export format: { seconds, nanoseconds }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000).toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** Map Firestore court state to our CourtStatus. */
function mapCourtStatus(state: string | undefined, online?: boolean): 'online' | 'offline' | 'maintenance' {
  if (state === 'maintenance') return 'maintenance';
  if (state === 'active' || state === 'online') return online !== false ? 'online' : 'offline';
  return 'offline';
}

/** Map Firestore reservation state to our ReservationStatus. */
function mapReservationStatus(state: string | undefined): ReservationStatus {
  if (state === 'finished' || state === 'finished_by_system') return 'confirmed';
  if (state === 'canceled' || state === 'canceled_by_system') return 'cancelled';
  return 'confirmed';
}

/** Guess match format from player count. */
function guessFormat(playerCount: number): MatchFormat {
  if (playerCount <= 2) return '1v1';
  if (playerCount <= 4) return '2v2';
  return '3v3';
}

// ── Gyms ───────────────────────────────────────────────────────────────────

export async function fbGetGyms(): Promise<Gym[]> {
  await ensureFirebaseAuth();
  // Collect court IDs from the courts collection only
  const snap = await getDocs(collection(getDb(), 'courts'));
  const courtIds = snap.docs.map(d => d.id);

  return [{
    id: LAIETA_GYM_ID,
    name: 'Club Esportiu Laietà',
    slug: 'laieta',
    address: 'Carrer dels Vergós, 3, 08017 Barcelona',
    city: 'Barcelona',
    timezone: 'Europe/Madrid',
    phone: '',
    email: '',
    openingHours: { weekdayOpen: '09:00', weekdayClose: '23:00', weekendOpen: '09:00', weekendClose: '23:00' },
    courts: courtIds,
    createdAt: new Date().toISOString(),
  }];
}

export async function fbGetGymById(id: string): Promise<Gym | undefined> {
  const gyms = await fbGetGyms();
  return gyms.find(g => g.id === id);
}

// ── Courts ─────────────────────────────────────────────────────────────────

export async function fbGetCourts(_gymId?: string): Promise<Court[]> {
  await ensureFirebaseAuth();

  // 1. Courts from the courts collection
  const snap = await getDocs(collection(getDb(), 'courts'));
  const courtsMap = new Map<string, Court>();

  snap.docs.forEach(d => {
    const data = d.data();
    courtsMap.set(d.id, {
      id: d.id,
      gymId: LAIETA_GYM_ID,
      name: data.name ?? '',
      location: data.locationName ?? data.address ?? '',
      status: mapCourtStatus(data.state, data.online),
      installedDate: '',
      firmwareVersion: undefined,
      lastHeartbeat: undefined,
      sensorStatus: 'ok',
      is_active: data.state === 'active' || data.state === 'online',
      address: data.address ?? '',
      opening_time: data.openingTime ?? '09:00',
      closing_time: data.closingTime ?? '21:00',
      is_visible: true,
      match_duration_minutes: data.config?.gameMaxDuration ? Math.round(data.config.gameMaxDuration / 60) : 20,
      slot_duration_minutes: data.config?.reservationSlotDuration ? Math.round(data.config.reservationSlotDuration / 60) : 30,
    });
  });

  return [...courtsMap.values()];
}

// ── Matches (from reservations/{id}/games subcollection — real scores) ─────

export async function fbGetMatches(filters?: {
  courtId?: string;
  format?: MatchFormat;
  days?: number;
  gymId?: string;
}): Promise<Match[]> {
  await ensureFirebaseAuth();
  const resSnap = await getDocs(collection(getDb(), 'reservations'));

  let results: Match[] = [];

  for (const rDoc of resSnap.docs) {
    const rData = rDoc.data();
    const gamesSnap = await getDocs(collection(getDb(), 'reservations', rDoc.id, 'games'));
    if (gamesSnap.empty) continue;

    // Extract player nicknames from reservation's embedded team data
    const team1Names = (rData.team1Players as Array<{ name?: string }>) ?? [];
    const team2Names = (rData.team2Players as Array<{ name?: string }>) ?? [];
    const playerNames = [...team1Names, ...team2Names].map(p => p.name).filter(Boolean) as string[];
    const courtName = (rData.court as { name?: string })?.name ?? '';

    for (const gDoc of gamesSnap.docs) {
      const g = gDoc.data();
      if (g.state !== 'finished') continue;

      const gameDate = toIso(g.createdAt);
      const playerCount = (g.playerIds as string[] | undefined)?.length ?? 1;
      const format = guessFormat(playerCount);

      results.push({
        id: gDoc.id,
        courtId: rData.courtId ?? '',
        courtName,
        format,
        scoreA: (g.team1Points as number) ?? 0,
        scoreB: (g.team2Points as number) ?? 0,
        duration: 0, // individual game duration not tracked
        startedAt: gameDate,
        endedAt: gameDate,
        playerCount,
        players: playerNames,
      });
    }
  }

  // Apply filters
  if (filters?.courtId) results = results.filter(m => m.courtId === filters.courtId);
  if (filters?.format) results = results.filter(m => m.format === filters.format);
  if (filters?.days) {
    const cutoff = Date.now() - filters.days * 86400000;
    results = results.filter(m => new Date(m.startedAt).getTime() >= cutoff);
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return results;
}

// ── Reservations ──────────────────────────────────────────────────────────

export async function fbGetReservations(filters?: {
  courtId?: string;
  date?: string;
  status?: ReservationStatus;
  gymId?: string;
}): Promise<Reservation[]> {
  await ensureFirebaseAuth();
  const snap = await getDocs(collection(getDb(), 'reservations'));

  let results: Reservation[] = snap.docs.map(d => {
    const data = d.data();
    const start = new Date(toIso(data.startDate));
    const end = new Date(toIso(data.endDate));
    const playerCount = (data.playerIds as string[] | undefined)?.length ?? 1;

    // Get owner name from embedded team1Players
    const players = (data.team1Players as Array<{ name?: string }>) ?? [];
    const ownerName = players[0]?.name ?? data.ownerEmail ?? 'Unknown';

    return {
      id: d.id,
      courtId: data.courtId ?? '',
      date: start.toISOString().slice(0, 10),
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      playerName: ownerName,
      format: guessFormat(playerCount) as MatchFormat,
      status: mapReservationStatus(data.state),
      createdAt: toIso(data.createdAt),
    };
  });

  // Apply filters
  if (filters?.courtId) results = results.filter(r => r.courtId === filters.courtId);
  if (filters?.date) results = results.filter(r => r.date === filters.date);
  if (filters?.status) results = results.filter(r => r.status === filters.status);

  // Sort newest first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return results;
}

// ── Club Members (from users collection) ──────────────────────────────────

export async function fbGetClubMembers(_gymId: string): Promise<ClubMember[]> {
  await ensureFirebaseAuth();
  const [usersSnap, statsSnap] = await Promise.all([
    getDocs(collection(getDb(), 'users')),
    getDocs(collection(getDb(), 'stats')),
  ]);

  // Build stats lookup by user ID
  const statsMap = new Map<string, { level?: number; gamesPlayed?: number; gamesWon?: number; winPercentage?: number }>();
  statsSnap.docs.forEach(d => {
    const data = d.data();
    statsMap.set(d.id, {
      level: data.level as number | undefined,
      gamesPlayed: data.gamesPlayed as number | undefined,
      gamesWon: data.gamesWon as number | undefined,
      winPercentage: data.winPercentage as number | undefined,
    });
  });

  return usersSnap.docs
    .filter(d => {
      const data = d.data();
      return data.state !== 'deleted' && data.name;
    })
    .map(d => {
      const data = d.data();
      const stats = statsMap.get(d.id);
      return {
        id: d.id,
        gymId: LAIETA_GYM_ID,
        userId: d.id,
        nickname: data.username ?? data.name ?? '',
        joinedAt: toIso(data.createdAt),
        level: stats?.level ?? (data.level as number | undefined),
        gamesPlayed: stats?.gamesPlayed,
        gamesWon: stats?.gamesWon,
        winPercentage: stats?.winPercentage,
      } satisfies ClubMember;
    });
}

// ── Stats ─────────────────────────────────────────────────────────────────

export async function fbGetStatsOverview(_gymId: string, _courtIds: string[]): Promise<StatsOverview> {
  const reservations = await fbGetReservations({});
  const matches = await fbGetMatches({});

  return {
    reservas_hechas: reservations.filter(r => r.status === 'confirmed').length,
    reservas_iniciadas: reservations.filter(r => {
      if (r.status !== 'confirmed') return false;
      return new Date(`${r.date}T${r.startTime}`) <= new Date();
    }).length,
    reservas_canceladas: reservations.filter(r => r.status === 'cancelled').length,
    partidos_jugados: matches.length,
    partidos_cancelados: 0,
  };
}

export async function fbGetDailyStats(_gymId: string, _courtIds: string[], days: number): Promise<DailyStats[]> {
  const [reservations, matches] = await Promise.all([
    fbGetReservations({}),
    fbGetMatches({ days }),
  ]);

  const result: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      reservations: reservations.filter(r => r.date === dateStr).length,
      matches: matches.filter(m => m.startedAt.slice(0, 10) === dateStr).length,
    });
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// WRITES
// ══════════════════════════════════════════════════════════════════════════

// ── Paso 1: Court config writes (updates existing courts/{id}) ────────────

export async function fbUpdateCourt(courtId: string, data: Partial<Court>): Promise<void> {
  await ensureFirebaseAuth();
  const ref = doc(getDb(), 'courts', courtId);

  // Map camelCase dashboard fields to Firestore field names
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.address !== undefined) patch.address = data.address;
  if (data.location !== undefined) patch.locationName = data.location;
  if (data.opening_time !== undefined) patch.openingTime = data.opening_time;
  if (data.closing_time !== undefined) patch.closingTime = data.closing_time;
  if (data.is_active !== undefined) {
    patch.state = data.is_active ? 'active' : 'inactive';
  }
  if (data.is_visible !== undefined) patch.online = data.is_visible;
  if (data.match_duration_minutes !== undefined) {
    patch['config.gameMaxDuration'] = data.match_duration_minutes * 60; // Firestore stores seconds
  }
  if (data.slot_duration_minutes !== undefined) {
    patch['config.reservationSlotDuration'] = data.slot_duration_minutes * 60;
  }

  await updateDoc(ref, patch);
}

// ── Paso 2: Court blocks (new collection court_blocks) ────────────────────

export interface FirebaseCourtBlock {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export async function fbGetCourtBlocks(courtId: string, date: string): Promise<FirebaseCourtBlock[]> {
  await ensureFirebaseAuth();
  const q = query(
    collection(getDb(), 'court_blocks'),
    where('courtId', '==', courtId),
    where('date', '==', date),
    orderBy('startTime'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      courtId: data.courtId as string,
      date: data.date as string,
      startTime: data.startTime as string,
      endTime: data.endTime as string,
      reason: data.reason as string | undefined,
      createdBy: data.createdBy as string,
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function fbCreateCourtBlock(data: {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}): Promise<FirebaseCourtBlock> {
  await ensureFirebaseAuth();
  const docRef = await addDoc(collection(getDb(), 'court_blocks'), {
    ...data,
    createdBy: 'laieta@hoopslam.net',
    createdAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    ...data,
    createdBy: 'laieta@hoopslam.net',
    createdAt: new Date().toISOString(),
  };
}

export async function fbDeleteCourtBlock(blockId: string): Promise<void> {
  await ensureFirebaseAuth();
  await deleteDoc(doc(getDb(), 'court_blocks', blockId));
}

// ── Paso 3: Court incidents (new collection court_incidents) ──────────────

export type IncidentType = 'hardware' | 'software' | 'user_report' | 'maintenance';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FirebaseCourtIncident {
  id: string;
  courtId: string;
  reservationId?: string;
  type: IncidentType;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  reportedBy: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export async function fbGetCourtIncidents(courtId?: string): Promise<FirebaseCourtIncident[]> {
  await ensureFirebaseAuth();
  const ref = collection(getDb(), 'court_incidents');
  const q = courtId
    ? query(ref, where('courtId', '==', courtId), orderBy('createdAt', 'desc'))
    : query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      courtId: data.courtId as string,
      reservationId: data.reservationId as string | undefined,
      type: (data.type as IncidentType) ?? 'maintenance',
      title: data.title as string,
      description: data.description as string,
      status: (data.status as IncidentStatus) ?? 'open',
      priority: (data.priority as IncidentPriority) ?? 'medium',
      reportedBy: data.reportedBy as string,
      resolvedBy: data.resolvedBy as string | undefined,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt ?? data.createdAt),
      resolvedAt: data.resolvedAt ? toIso(data.resolvedAt) : undefined,
    };
  });
}

export async function fbCreateCourtIncident(data: {
  courtId: string;
  reservationId?: string;
  type: IncidentType;
  title: string;
  description: string;
  priority: IncidentPriority;
}): Promise<FirebaseCourtIncident> {
  await ensureFirebaseAuth();
  const now = serverTimestamp();
  const docRef = await addDoc(collection(getDb(), 'court_incidents'), {
    ...data,
    status: 'open',
    reportedBy: 'laieta@hoopslam.net',
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: docRef.id,
    ...data,
    status: 'open',
    reportedBy: 'laieta@hoopslam.net',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function fbUpdateCourtIncident(incidentId: string, data: {
  status?: IncidentStatus;
  resolvedBy?: string;
}): Promise<void> {
  await ensureFirebaseAuth();
  const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (data.status !== undefined) patch.status = data.status;
  if (data.status === 'resolved') {
    patch.resolvedAt = serverTimestamp();
    patch.resolvedBy = data.resolvedBy ?? 'laieta@hoopslam.net';
  }
  await updateDoc(doc(getDb(), 'court_incidents', incidentId), patch);
}
