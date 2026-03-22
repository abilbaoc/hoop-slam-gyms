import type { Player } from '../../types';
import type { MatchFormat } from '../../types';
import { createRng, pick, pickWeighted, randomInt } from '../../utils/seed-random';
import { getELOLevel } from '../../utils/formatters';

const FIRST_NAMES = [
  'Carlos', 'Miguel', 'Alejandro', 'David', 'Javier', 'Daniel', 'Pablo',
  'Adrian', 'Sergio', 'Jorge', 'Raul', 'Hugo', 'Diego', 'Alvaro', 'Ivan',
  'Marcos', 'Mario', 'Ruben', 'Oscar', 'Andres', 'Victor', 'Enrique',
  'Fernando', 'Manuel', 'Rafael', 'Antonio', 'Jose', 'Luis', 'Pedro',
  'Angel', 'Gabriel', 'Nicolas', 'Samuel', 'Izan', 'Leo', 'Marc',
  'Pau', 'Arnau', 'Oriol', 'Biel', 'Jan', 'Eric', 'Alex', 'Pol',
  'Guillem', 'Roger', 'Marti', 'Jordi', 'Xavier', 'Albert',
];

const LAST_NAMES = [
  'Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Gonzalez', 'Rodriguez',
  'Fernandez', 'Perez', 'Gomez', 'Ruiz', 'Diaz', 'Hernandez',
  'Moreno', 'Alvarez', 'Munoz', 'Romero', 'Alonso', 'Navarro',
  'Torres', 'Dominguez', 'Vazquez', 'Ramos', 'Gil', 'Serrano',
  'Blanco', 'Molina', 'Morales', 'Suarez', 'Ortega', 'Delgado',
  'Castro', 'Ortiz', 'Rubio', 'Marin', 'Sanz', 'Iglesias',
  'Gutierrez', 'Prieto', 'Medina', 'Garrido', 'Santos', 'Castillo',
  'Cortes', 'Lozano', 'Guerrero', 'Cano', 'Cruz', 'Flores',
  'Caballero', 'Vidal',
];

function generateElo(rng: () => number): number {
  // Box-Muller transform for bell curve centered at 3.0, stddev 0.7 (scale 1.0–5.0)
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
  const elo = 3.0 + z * 0.7;
  return Math.round(Math.max(1.0, Math.min(5.0, elo)) * 10) / 10;
}

function getRecurrence(daysSinceLastPlayed: number): Player['recurrence'] {
  if (daysSinceLastPlayed <= 2) return 'diario';
  if (daysSinceLastPlayed <= 7) return 'semanal';
  if (daysSinceLastPlayed <= 30) return 'mensual';
  return 'inactivo';
}

function generatePlayers(): Player[] {
  const rng = createRng(42);
  const players: Player[] = [];
  const now = new Date('2026-03-19T12:00:00Z');

  for (let i = 0; i < 80; i++) {
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`;

    const elo = generateElo(rng);
    const matchesPlayed = randomInt(rng, 5, 150);
    const winRate = 0.3 + rng() * 0.4; // 30-70% win rate
    const wins = Math.round(matchesPlayed * winRate);
    const losses = matchesPlayed - wins;

    const preferredFormat = pickWeighted<MatchFormat>(
      rng,
      ['1v1', '2v2', '3v3'],
      [45, 35, 20],
    );

    // Days since last played: most active recently, some inactive
    const daysSinceLastPlayed = pickWeighted(
      rng,
      [0, 1, 2, 3, 5, 7, 14, 30, 60],
      [15, 15, 12, 10, 10, 10, 10, 10, 8],
    );
    const lastPlayedAt = new Date(now.getTime() - daysSinceLastPlayed * 86400000);

    // Joined between 6 months and 2 years ago
    const joinedDaysAgo = randomInt(rng, 30, 730);
    const joinedAt = new Date(now.getTime() - joinedDaysAgo * 86400000);

    // Distribute players across gyms
    const gymIds = ['gym-001', 'gym-002', 'gym-003'];
    const gymId = gymIds[i % gymIds.length];

    players.push({
      id: `player-${String(i + 1).padStart(3, '0')}`,
      gymId,
      name,
      initials,
      elo,
      level: getELOLevel(elo),
      matchesPlayed,
      wins,
      losses,
      preferredFormat,
      lastPlayedAt: lastPlayedAt.toISOString(),
      recurrence: getRecurrence(daysSinceLastPlayed),
      joinedAt: joinedAt.toISOString().split('T')[0],
    });
  }

  return players;
}

export const players: Player[] = generatePlayers();
