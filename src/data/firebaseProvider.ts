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
  getDocs,
  Timestamp,
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

// ── Matches (derived from finished reservations) ──────────────────────────

export async function fbGetMatches(filters?: {
  courtId?: string;
  format?: MatchFormat;
  days?: number;
  gymId?: string;
}): Promise<Match[]> {
  await ensureFirebaseAuth();
  const snap = await getDocs(collection(getDb(), 'reservations'));

  let results: Match[] = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const state = data.state as string;
    // Only finished reservations count as played matches
    if (state !== 'finished' && state !== 'finished_by_system') return;

    const startDate = toIso(data.startDate);
    const endDate = toIso(data.endDate);
    const playerCount = (data.playerIds as string[] | undefined)?.length ?? 1;
    const format = guessFormat(playerCount);
    const durationMin = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000);

    results.push({
      id: d.id,
      courtId: data.courtId ?? '',
      format,
      scoreA: 0, // no score data in Firestore
      scoreB: 0,
      duration: durationMin > 0 ? durationMin : 20,
      startedAt: startDate,
      endedAt: endDate,
      playerCount,
    });
  });

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
  const snap = await getDocs(collection(getDb(), 'users'));
  return snap.docs
    .filter(d => {
      const data = d.data();
      return data.state !== 'deleted' && data.name;
    })
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        gymId: LAIETA_GYM_ID,
        userId: d.id,
        nickname: data.username ?? data.name ?? '',
        joinedAt: toIso(data.createdAt),
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
