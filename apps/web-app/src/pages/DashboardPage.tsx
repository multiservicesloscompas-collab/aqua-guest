import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useAppStore } from '@/store/useAppStore';
import { DateSelector } from '@/components/ventas/DateSelector';
import { Card, CardContent } from '@/components/ui/card';
import {
  Droplets,
  TrendingUp,
  Receipt,
  DollarSign,
  Wallet,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
  Banknote,
  BarChart3,
} from 'lucide-react';
import {
  ChartDataPoint,
  Sale,
  WasherRental,
  PrepaidOrder,
  AppRoute,
  PaymentMethod,
} from '@/types';

interface DashboardPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const {
    sales,
    expenses,
    config,
    rentals,
    prepaidOrders,
    paymentBalanceTransactions,
  } = useAppStore();
  const [currency, setCurrency] = useState<'Bs' | 'USD'>('Bs');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const stats = useMemo(() => {
    const selected = new Date(selectedDate + 'T12:00:00');

    // Calcular inicio de semana (Domingo) en local
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - selected.getDay());
    const startOfWeekStr =
      startOfWeek.getFullYear() +
      '-' +
      String(startOfWeek.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(startOfWeek.getDate()).padStart(2, '0');

    // Calcular inicio de mes en local
    const startOfMonth = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      1
    );
    const startOfMonthStr =
      startOfMonth.getFullYear() +
      '-' +
      String(startOfMonth.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(startOfMonth.getDate()).padStart(2, '0');

    // Ventas de agua - usar comparación de strings
    const salesToday = sales.filter((s) => s.date === selectedDate);
    const salesWeek = sales.filter((s) => s.date >= startOfWeekStr);
    const salesMonth = sales.filter((s) => s.date >= startOfMonthStr);

    // Alquileres - usar comparación de strings
    const rentalsToday = rentals.filter((r) => r.date === selectedDate);
    const rentalsWeek = rentals.filter((r) => r.date >= startOfWeekStr);
    const rentalsMonth = rentals.filter((r) => r.date >= startOfMonthStr);

    // Egresos
    const expensesToday = expenses.filter((e: any) => e.date === selectedDate);
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

    // Calcular totales originales por método de pago (sin ajustes)
    const originalMethodTotals = {
      efectivo:
        salesToday
          .filter((s: Sale) => s.paymentMethod === 'efectivo')
          .reduce((sum: number, s: Sale) => sum + s.totalBs, 0) +
        rentalsToday
          .filter((r: WasherRental) => r.paymentMethod === 'efectivo')
          .reduce(
            (sum: number, r: WasherRental) =>
              sum + r.totalUsd * config.exchangeRate,
            0
          ) +
        prepaidOrders
          .filter(
            (p: PrepaidOrder) =>
              p.datePaid === selectedDate && p.paymentMethod === 'efectivo'
          )
          .reduce((sum: number, p: PrepaidOrder) => sum + p.amountBs, 0),
      pago_movil:
        salesToday
          .filter((s: Sale) => s.paymentMethod === 'pago_movil')
          .reduce((sum: number, s: Sale) => sum + s.totalBs, 0) +
        rentalsToday
          .filter((r: WasherRental) => r.paymentMethod === 'pago_movil')
          .reduce(
            (sum: number, r: WasherRental) =>
              sum + r.totalUsd * config.exchangeRate,
            0
          ) +
        prepaidOrders
          .filter(
            (p: PrepaidOrder) =>
              p.datePaid === selectedDate && p.paymentMethod === 'pago_movil'
          )
          .reduce((sum: number, p: PrepaidOrder) => sum + p.amountBs, 0),
      punto_venta:
        salesToday
          .filter((s: Sale) => s.paymentMethod === 'punto_venta')
          .reduce((sum: number, s: Sale) => sum + s.totalBs, 0) +
        rentalsToday
          .filter((r: WasherRental) => r.paymentMethod === 'punto_venta')
          .reduce(
            (sum: number, r: WasherRental) =>
              sum + r.totalUsd * config.exchangeRate,
            0
          ) +
        prepaidOrders
          .filter(
            (p: PrepaidOrder) =>
              p.datePaid === selectedDate && p.paymentMethod === 'punto_venta'
          )
          .reduce((sum: number, p: PrepaidOrder) => sum + p.amountBs, 0),
    };

    // Calcular ajustes por transacciones de equilibrio del día
    const balanceTransactionsForDay = paymentBalanceTransactions.filter(
      (t: any) => t.date === selectedDate
    );

    const calculateAdjustments = (method: PaymentMethod) => {
      return balanceTransactionsForDay.reduce(
        (adjustment: number, transaction: any) => {
          if (transaction.fromMethod === method) {
            return adjustment - transaction.amount; // Sale dinero de este método
          } else if (transaction.toMethod === method) {
            return adjustment + transaction.amount; // Entra dinero a este método
          }
          return adjustment;
        },
        0
      );
    };

    // Calcular totales finales con ajustes
    const methodTotals = {
      efectivo:
        originalMethodTotals.efectivo + calculateAdjustments('efectivo'),
      pago_movil:
        originalMethodTotals.pago_movil + calculateAdjustments('pago_movil'),
      punto_venta:
        originalMethodTotals.punto_venta + calculateAdjustments('punto_venta'),
    };

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
      methodTotals,
      originalMethodTotals, // Para referencia en el dashboard
    };
  }, [
    sales,
    expenses,
    rentals,
    prepaidOrders,
    paymentBalanceTransactions, // Agregar esta dependencia
    selectedDate,
    config.exchangeRate,
  ]);

  const weekData = useMemo((): ChartDataPoint[] => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const selected = new Date(selectedDate + 'T12:00:00');
    const currentDay = selected.getDay();

    return days.map((label, index) => {
      const date = new Date(selected);
      date.setDate(selected.getDate() - (currentDay - index));
      // Construct local date string manually
      const dateStr =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0');

      // Ventas de agua
      const daySales = sales.filter((s: Sale) => s.date === dateStr);
      const waterValue = daySales.reduce(
        (sum: number, s: Sale) => sum + s.totalBs,
        0
      );

      // Alquileres (USD -> Bs)
      const dayRentals = rentals.filter(
        (r: WasherRental) => r.date === dateStr
      );
      const rentalValue = dayRentals.reduce(
        (sum: number, r: WasherRental) =>
          sum + r.totalUsd * config.exchangeRate,
        0
      );

      return { label, value: waterValue + rentalValue, date: dateStr };
    });
  }, [sales, rentals, config.exchangeRate, selectedDate]);

  const selectedSales = sales.filter((s: Sale) => s.date === selectedDate);

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

        {/* Selector de fecha */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
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

        {/* Card de métricas de agua */}
        <Card
          className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
          onClick={() => onNavigate?.('metricas-agua')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Métricas de Agua
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Análisis detallado de ventas
                  </p>
                </div>
              </div>
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Resumen por método de pago */}
        <section className="bg-card rounded-2xl border p-5 space-y-4 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Resumen por Pago (Hoy)
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
              {currency === 'Bs' ? 'Bolívares' : 'Dólares'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Banknote className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-600/70 uppercase tracking-wider">
                    Efectivo
                  </p>
                  <p className="text-lg font-bold text-orange-950">
                    {currency === 'Bs' ? 'Bs ' : '$ '}
                    {(currency === 'Bs'
                      ? stats.methodTotals.efectivo
                      : stats.methodTotals.efectivo / config.exchangeRate
                    ).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  {currency === 'Bs' ? '$' : 'Bs'}
                  {(currency === 'Bs'
                    ? stats.methodTotals.efectivo / config.exchangeRate
                    : stats.methodTotals.efectivo
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600/70 uppercase tracking-wider">
                    Pago Móvil
                  </p>
                  <p className="text-lg font-bold text-blue-950">
                    {currency === 'Bs' ? 'Bs ' : '$ '}
                    {(currency === 'Bs'
                      ? stats.methodTotals.pago_movil
                      : stats.methodTotals.pago_movil / config.exchangeRate
                    ).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  {currency === 'Bs' ? '$' : 'Bs'}
                  {(currency === 'Bs'
                    ? stats.methodTotals.pago_movil / config.exchangeRate
                    : stats.methodTotals.pago_movil
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600/70 uppercase tracking-wider">
                    Punto de Venta
                  </p>
                  <p className="text-lg font-bold text-purple-950">
                    {currency === 'Bs' ? 'Bs ' : '$ '}
                    {(currency === 'Bs'
                      ? stats.methodTotals.punto_venta
                      : stats.methodTotals.punto_venta / config.exchangeRate
                    ).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">
                  {currency === 'Bs' ? '$' : 'Bs'}
                  {(currency === 'Bs'
                    ? stats.methodTotals.punto_venta / config.exchangeRate
                    : stats.methodTotals.punto_venta
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Card de equilibrio de pagos */}
        <Card
          className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10"
          onClick={() => onNavigate?.('equilibrio-pagos')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Equilibrar Pagos
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Transferir entre métodos de pago
                  </p>
                </div>
              </div>
              <ArrowLeftRight className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Ventas recientes */}
        <RecentSales sales={selectedSales} />

        {/* Gráfica de la semana */}
        <SalesChart
          data={weekData}
          activeIndex={new Date(selectedDate + 'T12:00:00').getDay()}
        />
      </main>
    </div>
  );
}
