import type { MatchFormat, Reservation, ReservationStatus } from '../../types';
import { createRng, pick, pickWeighted, randomInt } from '../../utils/seed-random';
import { courts } from './courts';

const rng = createRng(456);

const activeCourts = courts.filter((c) => c.status !== 'offline');

const playerNames = [
  'Carlos Ruiz', 'Maria Lopez', 'Pablo Fernandez', 'Ana Martinez',
  'Javier Garcia', 'Laura Sanchez', 'Diego Torres', 'Sofia Moreno',
  'Miguel Navarro', 'Elena Jimenez', 'Adrian Diaz', 'Carmen Romero',
  'Luis Herrera', 'Marta Alonso', 'Raul Gutierrez', 'Isabel Molina',
  'Fernando Ortiz', 'Paula Castro', 'Sergio Ramos', 'Lucia Blanco',
];

const formats: MatchFormat[] = ['1v1', '2v2', '3v3'];
const formatWeights = [40, 40, 20];

const statuses: ReservationStatus[] = ['confirmed', 'cancelled', 'blocked'];
const statusWeights = [85, 10, 5];

// Generate dates from 2026-03-19 to 2026-03-25
const dates: string[] = [];
for (let d = 19; d <= 25; d++) {
  dates.push(`2026-03-${String(d).padStart(2, '0')}`);
}

// Time slots: 30-min increments from 08:00 to 21:30
const timeSlots: string[] = [];
for (let h = 8; h <= 21; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21 || h === 21) {
    timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }
}

function addThirtyMinutes(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + 30;
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

const generated: Reservation[] = [];

for (let i = 0; i < 100; i++) {
  const court = pick(rng, activeCourts);
  const date = pick(rng, dates);
  const startTime = pick(rng, timeSlots);
  const endTime = addThirtyMinutes(startTime);

  const status = pickWeighted(rng, statuses, statusWeights);

  let playerName: string;
  let format: MatchFormat;

  if (status === 'blocked') {
    playerName = 'Mantenimiento';
    format = '1v1';
  } else {
    playerName = pick(rng, playerNames);
    format = pickWeighted(rng, formats, formatWeights);
  }

  // createdAt: random date in the last 7 days before 2026-03-19
  const daysAgo = randomInt(rng, 0, 6);
  const hoursAgo = randomInt(rng, 0, 23);
  const createdDate = new Date(2026, 2, 19 - daysAgo, hoursAgo);
  const createdAt = createdDate.toISOString();

  generated.push({
    id: `res-${String(i + 1).padStart(3, '0')}`,
    courtId: court.id,
    date,
    startTime,
    endTime,
    playerName,
    format,
    status,
    createdAt,
  });
}

export const reservations: Reservation[] = generated;
