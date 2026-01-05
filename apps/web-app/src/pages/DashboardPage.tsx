import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useAppStore } from '@/store/useAppStore';
import {
  Droplets,
  TrendingUp,
  Receipt,
  DollarSign,
  Wallet,
  ArrowLeftRight,
} from 'lucide-react';
import { ChartDataPoint } from '@/types';

export function DashboardPage() {
  const { sales, expenses, config, rentals } = useAppStore();
  const [currency, setCurrency] = useState<'Bs' | 'USD'>('Bs');

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const now = new Date();

    // Calcular inicio de semana (Domingo) en local
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr =
      startOfWeek.getFullYear() +
      '-' +
      String(startOfWeek.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(startOfWeek.getDate()).padStart(2, '0');

    // Calcular inicio de mes en local
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr =
      startOfMonth.getFullYear() +
      '-' +
      String(startOfMonth.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(startOfMonth.getDate()).padStart(2, '0');

    // Ventas de agua - usar comparación de strings
    const salesToday = sales.filter((s) => s.date === today);
    const salesWeek = sales.filter((s) => s.date >= startOfWeekStr);
    const salesMonth = sales.filter((s) => s.date >= startOfMonthStr);

    // Alquileres - usar comparación de strings
    const rentalsToday = rentals.filter((r) => r.date === today);
    const rentalsWeek = rentals.filter((r) => r.date >= startOfWeekStr);
    const rentalsMonth = rentals.filter((r) => r.date >= startOfMonthStr);

    // Egresos
    const expensesToday = expenses.filter((e: any) => e.date === today);
    const expensesWeek = expenses.filter((e: any) => e.date >= startOfWeekStr);
    const expensesMonth = expenses.filter(
      (e: any) => e.date >= startOfMonthStr
    );

    // Totales de agua (en Bs)
    const waterToday = salesToday.reduce((sum, s) => sum + s.totalBs, 0);
    const waterWeek = salesWeek.reduce((sum, s) => sum + s.totalBs, 0);
    const waterMonth = salesMonth.reduce((sum, s) => sum + s.totalBs, 0);

    // Totales de alquiler (USD -> Bs)
    const rentalTodayBs = rentalsToday.reduce(
      (sum, r) => sum + r.totalUsd * config.exchangeRate,
      0
    );
    const rentalWeekBs = rentalsWeek.reduce(
      (sum, r) => sum + r.totalUsd * config.exchangeRate,
      0
    );
    const rentalMonthBs = rentalsMonth.reduce(
      (sum, r) => sum + r.totalUsd * config.exchangeRate,
      0
    );

    // Totales combinados
    const totalToday = waterToday + rentalTodayBs;
    const totalWeek = waterWeek + rentalWeekBs;
    const totalMonth = waterMonth + rentalMonthBs;
    const expenseTodayTotal = expensesToday.reduce(
      (sum: number, e: any) => sum + e.amount,
      0
    );
    const expenseWeekTotal = expensesWeek.reduce(
      (sum: number, e: any) => sum + e.amount,
      0
    );
    const expenseMonthTotal = expensesMonth.reduce(
      (sum: number, e: any) => sum + e.amount,
      0
    );

    // Conteo de transacciones (agua + alquileres)
    const transactionsToday = salesToday.length + rentalsToday.length;

    return {
      totalToday,
      totalTodayUsd: totalToday / config.exchangeRate,
      totalWeek,
      totalWeekUsd: totalWeek / config.exchangeRate,
      totalMonth,
      totalMonthUsd: totalMonth / config.exchangeRate,
      salesCount: transactionsToday,
      expenseToday: expenseTodayTotal,
      expenseTodayUsd: expenseTodayTotal / config.exchangeRate,
      netToday: totalToday - expenseTodayTotal,
      netTodayUsd: (totalToday - expenseTodayTotal) / config.exchangeRate,
      netWeek: totalWeek - expenseWeekTotal,
      netWeekUsd: (totalWeek - expenseWeekTotal) / config.exchangeRate,
      netMonth: totalMonth - expenseMonthTotal,
      netMonthUsd: (totalMonth - expenseMonthTotal) / config.exchangeRate,
    };
  }, [sales, expenses, rentals, today, config.exchangeRate]);

  const weekData = useMemo((): ChartDataPoint[] => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const currentDay = now.getDay();

    return days.map((label, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (currentDay - index));
      // Construct local date string manually
      const dateStr =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0');

      // Ventas de agua
      const daySales = sales.filter((s) => s.date === dateStr);
      const waterValue = daySales.reduce((sum, s) => sum + s.totalBs, 0);

      // Alquileres (USD -> Bs)
      const dayRentals = rentals.filter((r) => r.date === dateStr);
      const rentalValue = dayRentals.reduce(
        (sum, r) => sum + r.totalUsd * config.exchangeRate,
        0
      );

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
            value={
              currency === 'Bs'
                ? `Bs ${stats.netWeek.toFixed(0)}`
                : `$ ${stats.netWeekUsd.toFixed(2)}`
            }
            subtitle={stats.netWeek >= 0 ? 'Neto' : 'Pérdida'}
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            variant={stats.netWeek >= 0 ? 'default' : 'warning'}
          />
          <KpiCard
            title="Mes"
            value={
              currency === 'Bs'
                ? `Bs ${stats.netMonth.toFixed(0)}`
                : `$ ${stats.netMonthUsd.toFixed(2)}`
            }
            subtitle={stats.netMonth >= 0 ? 'Neto' : 'Pérdida'}
            icon={<DollarSign className="w-4 h-4 text-primary" />}
            variant={stats.netMonth >= 0 ? 'default' : 'warning'}
          />
          <KpiCard
            title="Egresos Hoy"
            value={
              currency === 'Bs'
                ? `Bs ${stats.expenseToday.toFixed(0)}`
                : `$ ${stats.expenseTodayUsd.toFixed(2)}`
            }
            icon={<Wallet className="w-4 h-4 text-destructive" />}
            variant="danger"
          />
          <KpiCard
            title="Neto Hoy"
            value={
              currency === 'Bs'
                ? `Bs ${stats.netToday.toFixed(0)}`
                : `$ ${stats.netTodayUsd.toFixed(2)}`
            }
            subtitle={stats.netToday >= 0 ? 'Ganancia' : 'Pérdida'}
            variant={stats.netToday >= 0 ? 'success' : 'warning'}
          />
          <KpiCard
            title="Transacciones"
            value={stats.salesCount}
            subtitle="hoy"
            variant="success"
            icon={<Receipt className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            title="Moneda"
            value={currency}
            subtitle="Cambiar"
            icon={<ArrowLeftRight className="w-4 h-4 text-blue-500" />}
            variant="info"
            onClick={() =>
              setCurrency((prev) => (prev === 'Bs' ? 'USD' : 'Bs'))
            }
            className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all"
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
