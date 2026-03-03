import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useAppStore } from '@/store/useAppStore';
import { usePrepaidStore } from '@/store/usePrepaidStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useRentalStore } from '@/store/useRentalStore';
import { DateSelector } from '@/components/ventas/DateSelector';
import { Droplets } from 'lucide-react';
import { AppRoute, PaymentMethod } from '@/types';
import { DashboardKpiGrid } from './components/DashboardKpiGrid';
import { QuickActionsCards } from './components/QuickActionsCards';
import { PaymentMethodSummary } from './components/PaymentMethodSummary';
import { useDashboardData } from './hooks/useDashboardData';
import { useDashboardViewModel } from './hooks/useDashboardViewModel';

interface DashboardPageProps {
  onNavigate?: (route: AppRoute) => void;
  onPaymentMethodClick?: (method: PaymentMethod) => void;
}

export function DashboardPage({
  onNavigate,
  onPaymentMethodClick,
}: DashboardPageProps = {}) {
  const { selectedDate, setSelectedDate } = useAppStore();
  const { prepaidOrders } = usePrepaidStore();
  const { sales, loadSalesByDateRange } = useWaterSalesStore();
  const { expenses, loadExpensesByDateRange } = useExpenseStore();
  const { paymentBalanceTransactions } = usePaymentBalanceStore();
  const { config } = useConfigStore();
  const { rentals, loadRentalsByDateRange } = useRentalStore();
  const [currency, setCurrency] = useState<'Bs' | 'USD'>('Bs');
  const { loading } = useDashboardData(selectedDate, {
    loadSalesByDateRange,
    loadExpensesByDateRange,
    loadRentalsByDateRange,
  });

  const {
    weekData,
    selectedSales,
    activeIndex,
    kpiValues,
    kpiPrimary,
    paymentMethodItems,
    currencyLabel,
  } = useDashboardViewModel({
    selectedDate,
    exchangeRate: config.exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    currency,
  });

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="AquaGest" subtitle="Panel de Control" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* KPI Principal - Ventas del día seleccionado */}
        <KpiCard
          title={kpiPrimary.title}
          value={kpiPrimary.value}
          subtitle={kpiPrimary.subtitle}
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
        <DashboardKpiGrid
          currency={currency}
          onNavigate={onNavigate}
          onToggleCurrency={() =>
            setCurrency((prev) => (prev === 'Bs' ? 'USD' : 'Bs'))
          }
          values={kpiValues}
        />

        <QuickActionsCards onNavigate={onNavigate} />

        <PaymentMethodSummary
          currencyLabel={currencyLabel}
          items={paymentMethodItems}
          onPaymentMethodClick={onPaymentMethodClick}
        />

        {/* Ventas recientes */}
        <RecentSales sales={selectedSales} />

        {/* Gráfica de la semana */}
        <SalesChart data={weekData} activeIndex={activeIndex} />
      </main>
    </div>
  );
}
