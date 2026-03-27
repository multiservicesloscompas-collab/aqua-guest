import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { Header } from '@/components/layout/Header';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { useAppStore } from '@/store/useAppStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { usePrepaidStore } from '@/store/usePrepaidStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useTipStore } from '@/store/useTipStore';
import {
  TABLET_PRIMARY_COLUMN_COMPACT_CLASS,
  TABLET_SECONDARY_COLUMN_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { AppRoute } from '@/types';
import { DateSelector } from '@/components/ventas/DateSelector';

import { TransactionsSummaryList } from './TransactionsSummaryPage/components/TransactionsSummaryList';
import { TransactionsSummaryTotals } from './TransactionsSummaryPage/components/TransactionsSummaryTotals';
import { buildTransactionsSummaryItems } from './TransactionsSummaryPage/services/buildTransactionsSummaryItems';

interface TransactionsSummaryPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function TransactionsSummaryPage({
  onNavigate,
}: TransactionsSummaryPageProps = {}) {
  const { isTabletViewport } = useViewportMode();
  const { selectedDate, setSelectedDate } = useAppStore();
  const { prepaidOrders } = usePrepaidStore();
  const { sales } = useWaterSalesStore();
  const { expenses } = useExpenseStore();
  const { paymentBalanceTransactions } = usePaymentBalanceStore();
  const { config } = useConfigStore();
  const { rentals } = useRentalStore();
  const { tipPayouts } = useTipStore();

  const transactions = useMemo(() => {
    return buildTransactionsSummaryItems({
      selectedDate,
      exchangeRate: config.exchangeRate,
      sales,
      rentals,
      expenses,
      prepaidOrders,
      paymentBalanceTransactions,
      tipPayouts,
    });
  }, [
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    tipPayouts,
    selectedDate,
    config.exchangeRate,
  ]);

  const totalIncome = transactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amountBs, 0);

  const totalExpenses = transactions
    .filter((t) => !t.isIncome && t.type !== 'balance_transfer')
    .reduce((sum, t) => sum + t.amountBs, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <Header
        title="Transacciones"
        subtitle={format(
          new Date(selectedDate + 'T12:00:00'),
          "EEEE d 'de' MMMM",
          {
            locale: es,
          }
        )}
        showBack
        onBack={() => onNavigate?.('dashboard')}
      />

      <AppPageContainer>
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={`${TABLET_PRIMARY_COLUMN_COMPACT_CLASS} space-y-4`}
                data-testid="transactions-primary-column"
              >
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
                <TransactionsSummaryList transactions={transactions} />
              </div>
            }
            secondary={
              <aside
                className={TABLET_SECONDARY_COLUMN_CLASS}
                data-testid="transactions-secondary-column"
              >
                <TransactionsSummaryTotals
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                />
              </aside>
            }
          />
        ) : (
          <div className="space-y-4 pt-2">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
            <TransactionsSummaryTotals
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
            />
            <TransactionsSummaryList transactions={transactions} />
          </div>
        )}
      </AppPageContainer>
    </div>
  );
}
