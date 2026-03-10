import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PaymentBalancePage } from './index';

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

vi.mock('./hooks/usePaymentBalancePageViewModel', () => ({
  usePaymentBalancePageViewModel: () => ({
    selectedDate: '2026-03-08',
    setSelectedDate: vi.fn(),
    config: { exchangeRate: 36 },
    showAddForm: false,
    setShowAddForm: vi.fn(),
    editingTransaction: null,
    formData: {},
    setFormData: vi.fn(),
    isAdding: false,
    isUpdating: false,
    isDeleting: false,
    deletingId: null,
    balanceSummary: [],
    transactionsForDate: [],
    handleAddTransaction: vi.fn(),
    handleUpdateTransaction: vi.fn(),
    handleDeleteTransaction: vi.fn(),
    startEdit: vi.fn(),
    cancelEdit: vi.fn(),
    getMethodIcon: vi.fn(),
    getMethodColor: vi.fn(),
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: () => <div>Date</div>,
}));
vi.mock('./components/PaymentBalanceSummaryCard', () => ({
  PaymentBalanceSummaryCard: () => <div>Summary</div>,
}));
vi.mock('./components/PaymentBalanceFormCard', () => ({
  PaymentBalanceFormCard: () => <div>Form</div>,
}));
vi.mock('./components/PaymentBalanceTransactionsCard', () => ({
  PaymentBalanceTransactionsCard: () => <div>Transactions</div>,
}));

describe('PaymentBalancePage responsive summary module', () => {
  it('renders split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<PaymentBalancePage />);

    expect(
      screen.getByTestId('payment-balance-primary-column')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('payment-balance-secondary-column')
    ).toBeInTheDocument();
    const primaryHtml = (
      screen.getByTestId('payment-balance-primary-column') as unknown as {
        innerHTML: string;
      }
    ).innerHTML;
    expect(primaryHtml.indexOf('Date')).toBeLessThan(
      primaryHtml.indexOf('Summary')
    );
    expect(primaryHtml.indexOf('Summary')).toBeLessThan(
      primaryHtml.indexOf('Transactions')
    );
  });

  it('keeps mobile stack under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<PaymentBalancePage />);

    expect(
      screen.queryByTestId('payment-balance-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-balance-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });
});
