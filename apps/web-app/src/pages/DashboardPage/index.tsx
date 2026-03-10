import { useState } from 'react';
import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { TabletSectionGrid } from '@/components/layout/TabletSectionGrid';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
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
import {
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COLUMN_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';

interface DashboardPageProps {
  onNavigate?: (route: AppRoute) => void;
  onPaymentMethodClick?: (method: PaymentMethod) => void;
}

export function DashboardPage({
  onNavigate,
  onPaymentMethodClick,
}: DashboardPageProps = {}) {
  const { isTabletViewport, viewportMode } = useViewportMode();
  const isTabletLandscape = viewportMode === 'tablet-landscape';
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
      <AppPageContainer>
        <TabletSectionGrid>
          {/* Selector de fecha */}
          <div className={isTabletViewport ? 'col-span-2' : undefined}>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              loading={loading}
            />
          </div>

          {/* KPI Principal - Ventas del día seleccionado */}
          <div className={isTabletViewport ? 'col-span-2' : undefined}>
            <KpiCard
              title={kpiPrimary.title}
              value={kpiPrimary.value}
              subtitle={kpiPrimary.subtitle}
              icon={<Droplets className="w-5 h-5 text-primary-foreground" />}
              variant="primary"
            />
          </div>
        </TabletSectionGrid>

        {/* Grid de KPIs - Acumulado del mes hasta la fecha seleccionada */}
        <DashboardKpiGrid
          currency={currency}
          onNavigate={onNavigate}
          onToggleCurrency={() =>
            setCurrency((prev) => (prev === 'Bs' ? 'USD' : 'Bs'))
          }
          values={kpiValues}
        />

        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="dashboard-primary-column"
              >
                <QuickActionsCards onNavigate={onNavigate} />
                {!isTabletLandscape ? (
                  <PaymentMethodSummary
                    currencyLabel={currencyLabel}
                    items={paymentMethodItems}
                    onPaymentMethodClick={onPaymentMethodClick}
                  />
                ) : null}
                <RecentSales sales={selectedSales} />
                <SalesChart data={weekData} activeIndex={activeIndex} />
              </div>
            }
            secondary={
              <div
                className={TABLET_SECONDARY_COLUMN_CLASS}
                data-testid="dashboard-secondary-column"
              >
                {isTabletLandscape ? (
                  <PaymentMethodSummary
                    currencyLabel={currencyLabel}
                    items={paymentMethodItems}
                    onPaymentMethodClick={onPaymentMethodClick}
                  />
                ) : null}
              </div>
            }
          />
        ) : (
          <>
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
          </>
        )}
      </AppPageContainer>
    </div>
  );
}
