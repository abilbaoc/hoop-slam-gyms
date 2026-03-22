import type { Match } from '../../types';
import type { MatchFormat } from '../../types';
import { createRng, pick, pickWeighted, randomInt } from '../../utils/seed-random';
import { courts } from './courts';

function generateScore(rng: () => number): [number, number] {
  // Streetball format: first to 21 wins
  // Winner always scores 21, loser scores 0-20
  const winner = 21;
  const loser = randomInt(rng, 0, 20);
  // Randomly assign which team wins
  return rng() > 0.5 ? [winner, loser] : [loser, winner];
}

function generateMatches(): Match[] {
  const rng = createRng(123);
  const matches: Match[] = [];
  const now = new Date('2026-03-19T12:00:00Z');

  // Only use online courts for match generation
  const activeCourts = courts.filter((c) => c.status === 'online');

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now.getTime() - dayOffset * 86400000);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

    // Base matches per day: ~15-18, weekends get ~30% more
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMatchCount = randomInt(rng, 14, 18);
    const dayMatchCount = isWeekend
      ? Math.round(baseMatchCount * 1.3)
      : baseMatchCount;

    for (let m = 0; m < dayMatchCount; m++) {
      // Pick hour based on time distribution
      const hour = pickWeighted(
        rng,
        [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        [2, 4, 4, 3, 8, 7, 3, 5, 8, 14, 14, 12, 10, 8, 7],
      );
      const minute = randomInt(rng, 0, 59);

      const format = pickWeighted<MatchFormat>(
        rng,
        ['1v1', '2v2', '3v3'],
        [45, 35, 20],
      );

      const duration = pickWeighted(rng, [10, 20, 30], [30, 50, 20]);
      const playerCount = format === '1v1' ? 2 : format === '2v2' ? 4 : 6;

      const court = pick(rng, activeCourts);
      const [scoreA, scoreB] = generateScore(rng);

      const startedAt = new Date(date);
      startedAt.setHours(hour, minute, 0, 0);

      const endedAt = new Date(startedAt.getTime() + duration * 60000);

      matches.push({
        id: `match-${String(matches.length + 1).padStart(4, '0')}`,
        courtId: court.id,
        format,
        scoreA,
        scoreB,
        duration,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        playerCount,
      });
    }
  }

  return matches;
}

export const matches: Match[] = generateMatches();
