import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PaymentMethodDetailPage } from './index';

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

vi.mock('./hooks/usePaymentMethodDetailViewModel', () => ({
  usePaymentMethodDetailViewModel: () => ({
    pageTitle: 'Detalle',
    onBackRoute: 'dashboard',
    selectedDate: '2026-03-08',
    setSelectedDate: vi.fn(),
    kpi: {
      title: 'Total',
      valueText: 'Bs 0',
      subtitleText: '$0',
      icon: null,
      iconClass: '',
      borderClass: '',
    },
    summary: { income: 0, expense: 0, balance: 0 },
    switcherItems: [],
    transactionsCount: 0,
    transactions: [],
    emptyState: { message: 'Vacío', icon: null },
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: () => <div>Date</div>,
}));
vi.mock('./components/PaymentMethodTotalCard', () => ({
  PaymentMethodTotalCard: () => <div>TotalCard</div>,
}));
vi.mock('./components/PaymentMethodSummaryGrid', () => ({
  PaymentMethodSummaryGrid: () => <div>SummaryGrid</div>,
}));
vi.mock('./components/PaymentMethodTransactionsCard', () => ({
  PaymentMethodTransactionsCard: () => <div>Transactions</div>,
}));

describe('PaymentMethodDetailPage responsive summary module', () => {
  it('renders split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(
      <PaymentMethodDetailPage paymentMethod="efectivo" onNavigate={vi.fn()} />
    );

    expect(
      screen.getByTestId('payment-method-primary-column')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('payment-method-secondary-column')
    ).toBeInTheDocument();
  });

  it('keeps mobile stack under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(
      <PaymentMethodDetailPage paymentMethod="efectivo" onNavigate={vi.fn()} />
    );

    expect(
      screen.queryByTestId('payment-method-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('payment-method-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });
});
