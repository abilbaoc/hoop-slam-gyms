export interface StatsOverview {
  reservas_hechas: number;
  reservas_iniciadas: number;
  reservas_canceladas: number;
  partidos_jugados: number;
  partidos_cancelados: number;
}

export interface DailyStats {
  date: string;
  reservations: number;
  matches: number;
}
