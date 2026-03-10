import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DashboardPage } from './index';

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
  useAppStore: () => ({ selectedDate: '2026-03-07', setSelectedDate: vi.fn() }),
}));
vi.mock('@/store/usePrepaidStore', () => ({
  usePrepaidStore: () => ({ prepaidOrders: [] }),
}));
vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => ({ sales: [], loadSalesByDateRange: vi.fn() }),
}));
vi.mock('@/store/useExpenseStore', () => ({
  useExpenseStore: () => ({ expenses: [], loadExpensesByDateRange: vi.fn() }),
}));
vi.mock('@/store/usePaymentBalanceStore', () => ({
  usePaymentBalanceStore: () => ({ paymentBalanceTransactions: [] }),
}));
vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: () => ({ config: { exchangeRate: 36 } }),
}));
vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({ rentals: [], loadRentalsByDateRange: vi.fn() }),
}));

vi.mock('./hooks/useDashboardData', () => ({
  useDashboardData: () => ({ loading: false }),
}));
vi.mock('./hooks/useDashboardViewModel', () => ({
  useDashboardViewModel: () => ({
    weekData: [],
    selectedSales: [],
    activeIndex: 0,
    kpiValues: {
      mtdIncomeText: 'Bs 0',
      mtdNetText: 'Bs 0',
      mtdNetSubtitle: 'Ganancia',
      mtdNetVariant: 'default',
      dayExpenseText: 'Bs 0',
      dayNetText: 'Bs 0',
      dayNetSubtitle: 'Ganancia',
      dayNetVariant: 'success',
      dayTransactions: 0,
    },
    kpiPrimary: {
      title: 'Ingresos del Día',
      value: 'Bs 0',
      subtitle: '$0 USD',
    },
    paymentMethodItems: [],
    currencyLabel: 'Bolívares',
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/ui/KpiCard', () => ({ KpiCard: () => <div>Kpi</div> }));
vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: () => <div>Date</div>,
}));
vi.mock('./components/DashboardKpiGrid', () => ({
  DashboardKpiGrid: () => <div>KpiGrid</div>,
}));
vi.mock('./components/QuickActionsCards', () => ({
  QuickActionsCards: () => <div>QuickActions</div>,
}));
vi.mock('./components/PaymentMethodSummary', () => ({
  PaymentMethodSummary: () => <div>Summary</div>,
}));
vi.mock('@/components/dashboard/RecentSales', () => ({
  RecentSales: () => <div>Recent</div>,
}));
vi.mock('@/components/dashboard/SalesChart', () => ({
  SalesChart: () => <div>Chart</div>,
}));

describe('DashboardPage responsive tablet core', () => {
  it('renders split columns in tablet mode', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<DashboardPage />);

    expect(screen.getByTestId('dashboard-primary-column')).toBeInTheDocument();
    expect(
      screen.getByTestId('dashboard-secondary-column')
    ).toBeInTheDocument();
  });

  it('keeps mobile stack without split columns under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<DashboardPage />);

    expect(
      screen.queryByTestId('dashboard-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('dashboard-secondary-column')
    ).not.toBeInTheDocument();
  });
});
