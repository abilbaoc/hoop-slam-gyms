import type {
  Match,
  Court,
  Player,
  KPIData,
  DailyMatches,
  HourlyHeatmap,
  FormatDistribution,
  CourtOccupancy,
  RecentMatch,
  MatchFormat,
} from '../../types';

const NOW = new Date('2026-03-19T12:00:00Z');

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86400000);
}

export function getKPIs(matches: Match[], courts: Court[], players: Player[]): KPIData {
  const today = startOfDay(NOW);
  const yesterday = startOfDay(daysAgo(1));
  const weekAgo = daysAgo(7);

  const matchesToday = matches.filter((m) =>
    isSameDay(new Date(m.startedAt), today),
  ).length;

  const matchesYesterday = matches.filter((m) =>
    isSameDay(new Date(m.startedAt), yesterday),
  ).length;

  const matchesTodayTrend =
    matchesYesterday > 0
      ? Math.round(((matchesToday - matchesYesterday) / matchesYesterday) * 100)
      : 0;

  // Active players: those who played in last 7 days
  const activePlayers = players.filter(
    (p) => new Date(p.lastPlayedAt) >= weekAgo,
  ).length;

  // Active players last week vs week before
  const twoWeeksAgo = daysAgo(14);
  const activePlayersLastWeek = players.filter(
    (p) => {
      const d = new Date(p.lastPlayedAt);
      return d >= twoWeeksAgo && d < weekAgo;
    },
  ).length;

  const activePlayersTrend =
    activePlayersLastWeek > 0
      ? Math.round(((activePlayers - activePlayersLastWeek) / activePlayersLastWeek) * 100)
      : 0;

  // Average occupancy: matches today / (online courts * 12 operating hours) * 100
  const onlineCourts = courts.filter((c) => c.status === 'online').length;
  const maxSlotsPerDay = onlineCourts * 12; // 12 usable hours per court
  const avgOccupancy = maxSlotsPerDay > 0
    ? Math.round((matchesToday / maxSlotsPerDay) * 100)
    : 0;

  // Occupancy yesterday for trend
  const avgOccupancyYesterday = maxSlotsPerDay > 0
    ? Math.round((matchesYesterday / maxSlotsPerDay) * 100)
    : 0;
  const avgOccupancyTrend =
    avgOccupancyYesterday > 0
      ? Math.round(((avgOccupancy - avgOccupancyYesterday) / avgOccupancyYesterday) * 100)
      : 0;

  // Most popular format this week
  const weekMatches = matches.filter((m) => new Date(m.startedAt) >= weekAgo);
  const formatCounts: Record<string, number> = {};
  weekMatches.forEach((m) => {
    formatCounts[m.format] = (formatCounts[m.format] || 0) + 1;
  });
  const popularFormat = (Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '1v1') as MatchFormat;

  // Revenue: each match generates ~5 EUR base price
  const revenueToday = matchesToday * 5;
  const revenueYesterday = matchesYesterday * 5;
  const revenueTodayTrend =
    revenueYesterday > 0
      ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
      : 0;

  // Peak hour
  const hourCounts: Record<number, number> = {};
  const todayMatchesList = matches.filter((m) =>
    isSameDay(new Date(m.startedAt), today),
  );
  todayMatchesList.forEach((m) => {
    const h = new Date(m.startedAt).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHourNum = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '18';
  const peakHour = `${String(peakHourNum).padStart(2, '0')}:00`;

  return {
    matchesToday,
    matchesTodayTrend,
    activePlayers,
    activePlayersTrend,
    avgOccupancy,
    avgOccupancyTrend,
    popularFormat,
    totalMatchesWeek: weekMatches.length,
    revenueToday,
    revenueTodayTrend,
    peakHour,
  };
}

export function getDailyMatches(matches: Match[], days: number = 30): DailyMatches[] {
  const result: DailyMatches[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = startOfDay(daysAgo(i));
    const count = matches.filter((m) =>
      isSameDay(new Date(m.startedAt), date),
    ).length;

    result.push({
      date: date.toISOString().split('T')[0],
      matches: count,
    });
  }

  return result;
}

export function getHourlyHeatmap(matches: Match[]): HourlyHeatmap[] {
  const heatmap: HourlyHeatmap[] = [];

  // Initialize all day/hour combinations
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push({ day, hour, value: 0 });
    }
  }

  // Count matches per day/hour
  // We use last 4 weeks of data
  const fourWeeksAgo = daysAgo(28);
  const recentMatches = matches.filter((m) => new Date(m.startedAt) >= fourWeeksAgo);

  recentMatches.forEach((m) => {
    const d = new Date(m.startedAt);
    // Convert JS day (0=Sun) to our format (0=Mon)
    const jsDay = d.getDay();
    const day = jsDay === 0 ? 6 : jsDay - 1;
    const hour = d.getHours();

    const idx = day * 24 + hour;
    if (heatmap[idx]) {
      heatmap[idx].value++;
    }
  });

  return heatmap;
}

export function getFormatDistribution(matches: Match[]): FormatDistribution[] {
  const weekAgo = daysAgo(7);
  const weekMatches = matches.filter((m) => new Date(m.startedAt) >= weekAgo);
  const total = weekMatches.length;

  const counts: Record<MatchFormat, number> = { '1v1': 0, '2v2': 0, '3v3': 0 };
  weekMatches.forEach((m) => {
    counts[m.format]++;
  });

  return (['1v1', '2v2', '3v3'] as MatchFormat[]).map((format) => ({
    format,
    count: counts[format],
    percentage: total > 0 ? Math.round((counts[format] / total) * 100) : 0,
  }));
}

export function getCourtOccupancy(matches: Match[], courts: Court[]): CourtOccupancy[] {
  const today = startOfDay(NOW);

  return courts.map((court) => {
    const courtMatchesToday = matches.filter(
      (m) => m.courtId === court.id && isSameDay(new Date(m.startedAt), today),
    );

    // Occupancy based on 12-hour operating window
    const totalMinutesToday = courtMatchesToday.reduce((sum, m) => sum + m.duration, 0);
    const maxMinutes = 12 * 60; // 12 hours
    const occupancy = Math.min(100, Math.round((totalMinutesToday / maxMinutes) * 100));

    return {
      courtId: court.id,
      courtName: court.name,
      occupancy,
      matchesToday: courtMatchesToday.length,
    };
  });
}

export function getRecentMatches(
  matches: Match[],
  courts: Court[],
  limit: number = 10,
): RecentMatch[] {
  const courtMap = new Map(courts.map((c) => [c.id, c.name]));

  return [...matches]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      courtName: courtMap.get(m.courtId) || 'Desconocida',
      format: m.format,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      time: m.startedAt,
    }));
}
