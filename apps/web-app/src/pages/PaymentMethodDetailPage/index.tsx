import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
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
  const viewModel = usePaymentMethodDetailViewModel(paymentMethod);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title={viewModel.pageTitle}
        subtitle="Detalle de Transacciones"
        showBack
        onBack={() => onNavigate(viewModel.onBackRoute)}
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de fecha global */}
        <DateSelector
          selectedDate={viewModel.selectedDate}
          onDateChange={viewModel.setSelectedDate}
          loading={false}
        />

        {/* Card de total */}
        <PaymentMethodTotalCard
          title={viewModel.kpi.title}
          valueText={viewModel.kpi.valueText}
          subtitleText={viewModel.kpi.subtitleText}
          icon={viewModel.kpi.icon}
          iconClass={viewModel.kpi.iconClass}
          borderClass={viewModel.kpi.borderClass}
        />

        {/* Resumen de ingresos, egresos, equilibrios y selector de método */}
        <PaymentMethodSummaryGrid
          summary={viewModel.summary}
          switcherItems={viewModel.switcherItems}
          onPaymentMethodChange={onPaymentMethodChange}
        />

        {/* Lista de transacciones */}
        <PaymentMethodTransactionsCard
          count={viewModel.transactionsCount}
          items={viewModel.transactions}
          emptyMessage={viewModel.emptyState.message}
          emptyIcon={viewModel.emptyState.icon}
        />
      </main>
    </div>
  );
}
