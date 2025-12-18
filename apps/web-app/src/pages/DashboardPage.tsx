import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useAppStore } from '@/store/useAppStore';
import { Droplets, TrendingUp, Receipt, DollarSign } from 'lucide-react';
import { ChartDataPoint } from '@/types';

export function DashboardPage() {
  const { sales, expenses, config, rentals } = useAppStore();

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ventas de agua
    const salesToday = sales.filter((s) => s.date === today);
    const salesWeek = sales.filter((s) => new Date(s.date) >= startOfWeek);
    const salesMonth = sales.filter((s) => new Date(s.date) >= startOfMonth);

    // Alquileres
    const rentalsToday = rentals.filter((r) => r.date === today);
    const rentalsWeek = rentals.filter((r) => new Date(r.date) >= startOfWeek);
    const rentalsMonth = rentals.filter((r) => new Date(r.date) >= startOfMonth);

    // Egresos
    const expensesToday = expenses.filter((e) => e.date === today);

    // Totales de agua (en Bs)
    const waterToday = salesToday.reduce((sum, s) => sum + s.totalBs, 0);
    const waterWeek = salesWeek.reduce((sum, s) => sum + s.totalBs, 0);
    const waterMonth = salesMonth.reduce((sum, s) => sum + s.totalBs, 0);

    // Totales de alquiler (USD -> Bs)
    const rentalTodayBs = rentalsToday.reduce((sum, r) => sum + (r.totalUsd * config.exchangeRate), 0);
    const rentalWeekBs = rentalsWeek.reduce((sum, r) => sum + (r.totalUsd * config.exchangeRate), 0);
    const rentalMonthBs = rentalsMonth.reduce((sum, r) => sum + (r.totalUsd * config.exchangeRate), 0);

    // Totales combinados
    const totalToday = waterToday + rentalTodayBs;
    const totalWeek = waterWeek + rentalWeekBs;
    const totalMonth = waterMonth + rentalMonthBs;
    const expenseTodayTotal = expensesToday.reduce((sum, e) => sum + e.amount, 0);

    // Conteo de transacciones (agua + alquileres)
    const transactionsToday = salesToday.length + rentalsToday.length;

    return {
      totalToday,
      totalTodayUsd: totalToday / config.exchangeRate,
      totalWeek,
      totalMonth,
      salesCount: transactionsToday,
      expenseToday: expenseTodayTotal,
      netToday: totalToday - expenseTodayTotal,
    };
  }, [sales, expenses, rentals, today, config.exchangeRate]);

  const weekData = useMemo((): ChartDataPoint[] => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const currentDay = now.getDay();

    return days.map((label, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (currentDay - index));
      const dateStr = date.toISOString().split('T')[0];
      
      // Ventas de agua
      const daySales = sales.filter((s) => s.date === dateStr);
      const waterValue = daySales.reduce((sum, s) => sum + s.totalBs, 0);
      
      // Alquileres (USD -> Bs)
      const dayRentals = rentals.filter((r) => r.date === dateStr);
      const rentalValue = dayRentals.reduce((sum, r) => sum + (r.totalUsd * config.exchangeRate), 0);

      return { label, value: waterValue + rentalValue, date: dateStr };
    });
  }, [sales, rentals, config.exchangeRate]);

  const todaySales = sales.filter((s) => s.date === today);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="AquaGest" subtitle="Panel de Control" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* KPI Principal */}
        <KpiCard
          title="Ventas de Hoy"
          value={`Bs ${stats.totalToday.toFixed(2)}`}
          subtitle={`$${stats.totalTodayUsd.toFixed(2)} USD`}
          icon={<Droplets className="w-5 h-5 text-primary-foreground" />}
          variant="primary"
        />

        {/* Grid de KPIs secundarios */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            title="Semana"
            value={`Bs ${stats.totalWeek.toFixed(0)}`}
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            title="Mes"
            value={`Bs ${stats.totalMonth.toFixed(0)}`}
            icon={<DollarSign className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            title="Transacciones"
            value={stats.salesCount}
            subtitle="hoy"
            icon={<Receipt className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            title="Neto Hoy"
            value={`Bs ${stats.netToday.toFixed(0)}`}
            subtitle={stats.netToday >= 0 ? 'Ganancia' : 'Pérdida'}
            variant={stats.netToday >= 0 ? 'success' : 'warning'}
          />
        </div>

        {/* Gráfica de la semana */}
        <SalesChart data={weekData} activeIndex={new Date().getDay()} />

        {/* Ventas recientes */}
        <RecentSales sales={todaySales} />
      </main>
    </div>
  );
}
