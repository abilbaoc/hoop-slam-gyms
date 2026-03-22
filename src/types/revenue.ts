export interface RevenueData {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  trend: number; // % change vs previous period
}

export interface RevenueByDay {
  date: string;
  amount: number;
}
