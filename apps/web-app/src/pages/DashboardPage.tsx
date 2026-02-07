import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ChartDataPoint, Sale, WasherRental, AppRoute } from '@/types';
import {
  calculateDashboardMetrics,
  getMonthToDateRange,
} from '@/services/DashboardMetricsService';

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
    loadDataForDateRange,
  } = useAppStore();
  const [currency, setCurrency] = useState<'Bs' | 'USD'>('Bs');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const lastLoadedRange = useRef<string>('');

  const loadMonthData = useCallback(
    async (date: string) => {
      const range = getMonthToDateRange(date);
      const rangeKey = `${range.start}_${range.end}`;
      if (lastLoadedRange.current === rangeKey) return;
      lastLoadedRange.current = rangeKey;
      setLoading(true);
      try {
        await loadDataForDateRange(range.start, range.end);
      } catch (err) {
        console.error('Error loading month data for dashboard', err);
      } finally {
        setLoading(false);
      }
    },
    [loadDataForDateRange]
  );

  useEffect(() => {
    loadMonthData(selectedDate);
  }, [selectedDate, loadMonthData]);

  const metrics = useMemo(
    () =>
      calculateDashboardMetrics({
        selectedDate,
        exchangeRate: config.exchangeRate,
        sales,
        rentals,
        expenses,
        prepaidOrders,
        paymentBalanceTransactions,
      }),
    [
      sales,
      expenses,
      rentals,
      prepaidOrders,
      paymentBalanceTransactions,
      selectedDate,
      config.exchangeRate,
    ]
  );

  const toUsd = (bs: number): number => bs / config.exchangeRate;

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
        {/* KPI Principal - Ventas del día seleccionado */}
        <KpiCard
          title="Ingresos del Día"
          value={`Bs ${metrics.day.totalIncomeBs.toFixed(2)}`}
          subtitle={`$${toUsd(metrics.day.totalIncomeBs).toFixed(2)} USD`}
          icon={<Droplets className="w-5 h-5 text-primary-foreground" />}
          variant="primary"
        />

        {/* Selector de fecha */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={loading}
        />

        {/* Grid de KPIs - Acumulado del mes hasta la fecha seleccionada */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            title="Acumulado Mes"
            value={
              currency === 'Bs'
                ? `Bs ${metrics.mtd.totalIncomeBs.toFixed(0)}`
                : `$ ${toUsd(metrics.mtd.totalIncomeBs).toFixed(2)}`
            }
            subtitle="Ingresos"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            variant="default"
          />
          <KpiCard
            title="Neto Mes"
            value={
              currency === 'Bs'
                ? `Bs ${metrics.mtd.netBs.toFixed(0)}`
                : `$ ${toUsd(metrics.mtd.netBs).toFixed(2)}`
            }
            subtitle={metrics.mtd.netBs >= 0 ? 'Ganancia' : 'Pérdida'}
            icon={<DollarSign className="w-4 h-4 text-primary" />}
            variant={metrics.mtd.netBs >= 0 ? 'default' : 'warning'}
          />
          <KpiCard
            title="Egresos Mes"
            value={
              currency === 'Bs'
                ? `Bs ${metrics.mtd.expenseBs.toFixed(0)}`
                : `$ ${toUsd(metrics.mtd.expenseBs).toFixed(2)}`
            }
            icon={<Wallet className="w-4 h-4 text-destructive" />}
            variant="danger"
          />
          <KpiCard
            title="Neto Hoy"
            value={
              currency === 'Bs'
                ? `Bs ${metrics.day.netBs.toFixed(0)}`
                : `$ ${toUsd(metrics.day.netBs).toFixed(2)}`
            }
            subtitle={metrics.day.netBs >= 0 ? 'Ganancia' : 'Pérdida'}
            variant={metrics.day.netBs >= 0 ? 'success' : 'warning'}
          />
          <KpiCard
            title="Transacciones"
            value={metrics.mtd.transactionsCount}
            subtitle="acumulado mes"
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

        {/* Resumen por método de pago - Acumulado del mes */}
        <section className="bg-card rounded-2xl border p-5 space-y-4 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Resumen por Pago (Mes)
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
                      ? metrics.mtd.methodTotalsBs.efectivo
                      : toUsd(metrics.mtd.methodTotalsBs.efectivo)
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
                    ? toUsd(metrics.mtd.methodTotalsBs.efectivo)
                    : metrics.mtd.methodTotalsBs.efectivo
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
                      ? metrics.mtd.methodTotalsBs.pago_movil
                      : toUsd(metrics.mtd.methodTotalsBs.pago_movil)
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
                    ? toUsd(metrics.mtd.methodTotalsBs.pago_movil)
                    : metrics.mtd.methodTotalsBs.pago_movil
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
                      ? metrics.mtd.methodTotalsBs.punto_venta
                      : toUsd(metrics.mtd.methodTotalsBs.punto_venta)
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
                    ? toUsd(metrics.mtd.methodTotalsBs.punto_venta)
                    : metrics.mtd.methodTotalsBs.punto_venta
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600/70 uppercase tracking-wider">
                    Divisa
                  </p>
                  <p className="text-lg font-bold text-green-950">
                    {currency === 'Bs' ? 'Bs ' : '$ '}
                    {(currency === 'Bs'
                      ? metrics.mtd.methodTotalsBs.divisa
                      : toUsd(metrics.mtd.methodTotalsBs.divisa)
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
                    ? toUsd(metrics.mtd.methodTotalsBs.divisa)
                    : metrics.mtd.methodTotalsBs.divisa
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

 

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
