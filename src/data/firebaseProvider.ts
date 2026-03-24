/**
 * Firebase Data Provider
 *
 * Lee datos de Firestore y los mapea a los tipos internos del dashboard.
 *
 * ─── NOMBRES DE COLECCIÓN ──────────────────────────────────────────────────
 * Ajusta estas constantes en cuanto el ingeniero confirme los nombres reales.
 * ───────────────────────────────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { Gym } from '../types/gym';
import type { Court } from '../types';
import type { Match, MatchFormat } from '../types';
import type { Reservation, ReservationStatus } from '../types';
import type { ClubMember } from '../types/club_member';
import type { StatsOverview, DailyStats } from '../types/stats';

// ── Colecciones — ajustar con los nombres reales de Firebase ──────────────
const COL = {
  gyms:         'gyms',           // TODO: confirmar con ingeniero
  courts:       'courts',         // TODO: confirmar con ingeniero
  matches:      'matches',        // TODO: confirmar con ingeniero (¿sessions? ¿games?)
  reservations: 'reservations',   // TODO: confirmar con ingeniero (¿bookings?)
  clubMembers:  'club_members',   // TODO: confirmar con ingeniero (¿memberships?)
  players:      'players',        // TODO: confirmar con ingeniero
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

// ── Gyms ──────────────────────────────────────────────────────────────────

export async function fbGetGyms(): Promise<Gym[]> {
  const snap = await getDocs(collection(getDb(), COL.gyms));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:           d.id,
      name:         data.name ?? '',
      slug:         data.slug ?? d.id,
      address:      data.address ?? '',
      city:         data.city ?? '',
      timezone:     data.timezone ?? 'Europe/Madrid',
      phone:        data.phone ?? '',
      email:        data.email ?? '',
      openingHours: data.openingHours ?? { weekdayOpen: '09:00', weekdayClose: '21:00', weekendOpen: '10:00', weekendClose: '20:00' },
      courts:       data.courts ?? [],
      createdAt:    toIso(data.createdAt),
    } satisfies Gym;
  });
}

export async function fbGetGymById(id: string): Promise<Gym | undefined> {
  const snap = await getDoc(doc(getDb(), COL.gyms, id));
  if (!snap.exists()) return undefined;
  const data = snap.data();
  return {
    id:           snap.id,
    name:         data.name ?? '',
    slug:         data.slug ?? snap.id,
    address:      data.address ?? '',
    city:         data.city ?? '',
    timezone:     data.timezone ?? 'Europe/Madrid',
    phone:        data.phone ?? '',
    email:        data.email ?? '',
    openingHours: data.openingHours ?? { weekdayOpen: '09:00', weekdayClose: '21:00', weekendOpen: '10:00', weekendClose: '20:00' },
    courts:       data.courts ?? [],
    createdAt:    toIso(data.createdAt),
  };
}

// ── Courts ────────────────────────────────────────────────────────────────

export async function fbGetCourts(gymId?: string): Promise<Court[]> {
  const ref = collection(getDb(), COL.courts);
  const q = gymId ? query(ref, where('gymId', '==', gymId)) : ref;
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:                    d.id,
      gymId:                 data.gymId ?? '',
      name:                  data.name ?? '',
      location:              data.location ?? '',
      status:                data.status ?? 'offline',
      installedDate:         data.installedDate ?? '',
      firmwareVersion:       data.firmwareVersion ?? '',
      lastHeartbeat:         toIso(data.lastHeartbeat),
      sensorStatus:          data.sensorStatus ?? 'ok',
      is_active:             data.is_active ?? true,
      address:               data.address ?? '',
      opening_time:          data.opening_time ?? '09:00',
      closing_time:          data.closing_time ?? '21:00',
      is_visible:            data.is_visible ?? true,
      match_duration_minutes: data.match_duration_minutes ?? 20,
      slot_duration_minutes:  data.slot_duration_minutes ?? 30,
    } satisfies Court;
  });
}

// ── Matches ───────────────────────────────────────────────────────────────

export async function fbGetMatches(filters?: {
  courtId?: string;
  format?: MatchFormat;
  days?: number;
  gymId?: string;
}): Promise<Match[]> {
  const ref = collection(getDb(), COL.matches);
  const constraints = [];

  if (filters?.courtId) constraints.push(where('courtId', '==', filters.courtId));
  if (filters?.format)  constraints.push(where('format', '==', filters.format));
  if (filters?.days) {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - filters.days * 86400000));
    constraints.push(where('startedAt', '>=', cutoff));
  }
  constraints.push(orderBy('startedAt', 'desc'), limit(500));

  const snap = await getDocs(query(ref, ...constraints));
  let result: Match[] = snap.docs.map(d => {
    const data = d.data();
    return {
      id:          d.id,
      courtId:     data.courtId ?? '',
      format:      data.format ?? '1v1',
      scoreA:      data.scoreA ?? 0,
      scoreB:      data.scoreB ?? 0,
      duration:    data.duration ?? 20,
      startedAt:   toIso(data.startedAt),
      endedAt:     toIso(data.endedAt),
      playerCount: data.playerCount ?? 2,
    } satisfies Match;
  });

  // Filtro por gymId en cliente si no hay índice compuesto en Firebase
  if (filters?.gymId) {
    // Requiere saber los courtIds del gym — esto se resuelve con un join en cliente
    // TODO: optimizar con índice compuesto courtId+gymId en Firestore si el volumen es alto
  }

  return result;
}

// ── Reservations ──────────────────────────────────────────────────────────

export async function fbGetReservations(filters?: {
  courtId?: string;
  date?: string;
  status?: ReservationStatus;
  gymId?: string;
}): Promise<Reservation[]> {
  const ref = collection(getDb(), COL.reservations);
  const constraints = [];

  if (filters?.courtId) constraints.push(where('courtId', '==', filters.courtId));
  if (filters?.date)    constraints.push(where('date', '==', filters.date));
  if (filters?.status)  constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('createdAt', 'desc'), limit(500));

  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:         d.id,
      courtId:    data.courtId ?? '',
      date:       data.date ?? '',
      startTime:  data.startTime ?? '',
      endTime:    data.endTime ?? '',
      playerName: data.playerName ?? data.userName ?? '',
      format:     data.format ?? '1v1',
      status:     data.status ?? 'confirmed',
      createdAt:  toIso(data.createdAt),
    } satisfies Reservation;
  });
}

// ── Club Members ──────────────────────────────────────────────────────────

export async function fbGetClubMembers(gymId: string): Promise<ClubMember[]> {
  const ref = collection(getDb(), COL.clubMembers);
  const snap = await getDocs(query(ref, where('gymId', '==', gymId)));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:       d.id,
      gymId:    data.gymId ?? gymId,
      userId:   data.userId ?? '',
      nickname: data.nickname ?? data.displayName ?? '',
      // email omitido — solo nickname visible en dashboard según política de datos
      joinedAt: toIso(data.joinedAt ?? data.createdAt),
    } satisfies ClubMember;
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────

export async function fbGetStatsOverview(gymId: string, courtIds: string[]): Promise<StatsOverview> {
  const [reservations, matches] = await Promise.all([
    fbGetReservations({ gymId }),
    fbGetMatches({ gymId }),
  ]);

  // Filtrar por courtIds del gym
  const gymReservations = reservations.filter(r => courtIds.includes(r.courtId));
  const gymMatches = matches.filter(m => courtIds.includes(m.courtId));
  const now = new Date();

  return {
    reservas_hechas:     gymReservations.filter(r => r.status === 'confirmed').length,
    reservas_iniciadas:  gymReservations.filter(r => {
      if (r.status !== 'confirmed') return false;
      return new Date(`${r.date}T${r.startTime}`) <= now;
    }).length,
    reservas_canceladas: gymReservations.filter(r => r.status === 'cancelled').length,
    partidos_jugados:    gymMatches.length,
    partidos_cancelados: 0,
  };
}

export async function fbGetDailyStats(gymId: string, courtIds: string[], days: number): Promise<DailyStats[]> {
  const [reservations, matches] = await Promise.all([
    fbGetReservations({ gymId }),
    fbGetMatches({ gymId, days }),
  ]);

  const gymReservations = reservations.filter(r => courtIds.includes(r.courtId));
  const gymMatches = matches.filter(m => courtIds.includes(m.courtId));
  const result: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date:         dateStr,
      reservations: gymReservations.filter(r => r.date === dateStr).length,
      matches:      gymMatches.filter(m => m.startedAt.slice(0, 10) === dateStr).length,
    });
  }
  return result;
}
