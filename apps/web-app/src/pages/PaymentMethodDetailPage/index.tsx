import { Header } from '@/components/layout/Header';
import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { DateSelector } from '@/components/ventas/DateSelector';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import {
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COLUMN_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { PaymentMethod, AppRoute } from '@/types';
import { PaymentMethodTotalCard } from './components/PaymentMethodTotalCard';
import { PaymentMethodSummaryGrid } from './components/PaymentMethodSummaryGrid';
import { PaymentMethodTransactionsCard } from './components/PaymentMethodTransactionsCard';
import { usePaymentMethodDetailViewModel } from './hooks/usePaymentMethodDetailViewModel';

interface PaymentMethodDetailPageProps {
  paymentMethod: PaymentMethod;
  onNavigate: (route: AppRoute) => void;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
}

export function PaymentMethodDetailPage({
  paymentMethod,
  onNavigate,
  onPaymentMethodChange,
}: PaymentMethodDetailPageProps) {
  const { isTabletViewport } = useViewportMode();
  const viewModel = usePaymentMethodDetailViewModel(paymentMethod);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title={viewModel.pageTitle}
        subtitle="Detalle de Transacciones"
        showBack
        onBack={() => onNavigate(viewModel.onBackRoute)}
      />

      <AppPageContainer>
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="payment-method-primary-column"
              >
                <PaymentMethodTransactionsCard
                  count={viewModel.transactionsCount}
                  items={viewModel.transactions}
                  emptyMessage={viewModel.emptyState.message}
                  emptyIcon={viewModel.emptyState.icon}
                />
              </div>
            }
            secondary={
              <aside
                className={TABLET_SECONDARY_COLUMN_CLASS}
                data-testid="payment-method-secondary-column"
              >
                <DateSelector
                  selectedDate={viewModel.selectedDate}
                  onDateChange={viewModel.setSelectedDate}
                  loading={false}
                />

                <PaymentMethodTotalCard
                  title={viewModel.kpi.title}
                  valueText={viewModel.kpi.valueText}
                  subtitleText={viewModel.kpi.subtitleText}
                  icon={viewModel.kpi.icon}
                  iconClass={viewModel.kpi.iconClass}
                  borderClass={viewModel.kpi.borderClass}
                />

                <PaymentMethodSummaryGrid
                  summary={viewModel.summary}
                  switcherItems={viewModel.switcherItems}
                  onPaymentMethodChange={onPaymentMethodChange}
                />
              </aside>
            }
          />
        ) : (
          <>
            <DateSelector
              selectedDate={viewModel.selectedDate}
              onDateChange={viewModel.setSelectedDate}
              loading={false}
            />

            <PaymentMethodTotalCard
              title={viewModel.kpi.title}
              valueText={viewModel.kpi.valueText}
              subtitleText={viewModel.kpi.subtitleText}
              icon={viewModel.kpi.icon}
              iconClass={viewModel.kpi.iconClass}
              borderClass={viewModel.kpi.borderClass}
            />

            <PaymentMethodSummaryGrid
              summary={viewModel.summary}
              switcherItems={viewModel.switcherItems}
              onPaymentMethodChange={onPaymentMethodChange}
            />

            <PaymentMethodTransactionsCard
              count={viewModel.transactionsCount}
              items={viewModel.transactions}
              emptyMessage={viewModel.emptyState.message}
              emptyIcon={viewModel.emptyState.icon}
            />
          </>
        )}
      </AppPageContainer>
    </div>
  );
}
