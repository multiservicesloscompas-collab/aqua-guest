import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TransactionsSummaryPage } from './TransactionsSummaryPage';

const viewportState = vi.hoisted(() => ({
  viewportMode: 'mobile' as
    | 'mobile'
    | 'tablet-portrait'
    | 'tablet-landscape'
    | 'desktop-or-other',
  isMobileViewport: true,
  isTabletViewport: false,
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => viewportState,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({ selectedDate: '2026-03-08' }),
}));
vi.mock('@/store/usePrepaidStore', () => ({
  usePrepaidStore: () => ({ prepaidOrders: [] }),
}));
vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => ({ sales: [] }),
}));
vi.mock('@/store/useExpenseStore', () => ({
  useExpenseStore: () => ({ expenses: [] }),
}));
vi.mock('@/store/usePaymentBalanceStore', () => ({
  usePaymentBalanceStore: () => ({ paymentBalanceTransactions: [] }),
}));
vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: () => ({ config: { exchangeRate: 36 } }),
}));
vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({ rentals: [] }),
}));
vi.mock('@/store/useTipStore', () => ({
  useTipStore: () => ({ tipPayouts: [] }),
}));

vi.mock(
  './TransactionsSummaryPage/services/buildTransactionsSummaryItems',
  () => ({
    buildTransactionsSummaryItems: () => [],
  })
);

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock(
  './TransactionsSummaryPage/components/TransactionsSummaryTotals',
  () => ({
    TransactionsSummaryTotals: () => <div>Totals</div>,
  })
);
vi.mock('./TransactionsSummaryPage/components/TransactionsSummaryList', () => ({
  TransactionsSummaryList: () => <div>List</div>,
}));

describe('TransactionsSummaryPage responsive summary module', () => {
  it('renders split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<TransactionsSummaryPage />);

    expect(
      screen.getByTestId('transactions-primary-column')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('transactions-secondary-column')
    ).toBeInTheDocument();
  });

  it('keeps mobile stack under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<TransactionsSummaryPage />);

    expect(
      screen.queryByTestId('transactions-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('transactions-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Totals')).toBeInTheDocument();
  });
});
