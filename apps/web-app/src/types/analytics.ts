export interface DashboardStats {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalSalesYear: number;
  totalExpensesToday: number;
  totalExpensesMonth: number;
  salesCount: number;
  averageTicket: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}
