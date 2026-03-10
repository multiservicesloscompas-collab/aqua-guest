import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Index from './Index';

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

vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    containerRef: { current: null },
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    progress: 0,
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    loadFromSupabase: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/store/useMachineStore', () => ({
  useMachineStore: {
    getState: () => ({
      loadWashingMachines: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/components/layout/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}));

vi.mock('@/components/layout/MenuSheet', () => ({
  MenuSheet: () => <div data-testid="menu-sheet" />,
}));

vi.mock('@/components/layout/TabletNavigationRail', () => ({
  TabletNavigationRail: () => <div data-testid="tablet-navigation-rail" />,
}));

vi.mock('@/pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard mock</div>,
}));

vi.mock('@/pages/WaterSalesPage', () => ({
  WaterSalesPage: () => <div>Ventas mock</div>,
}));

vi.mock('@/pages/RentalsPage', () => ({
  RentalsPage: () => <div>Alquiler mock</div>,
}));

vi.mock('@/pages/ExpensesPage', () => ({
  ExpensesPage: () => <div>Egresos mock</div>,
}));

vi.mock('@/pages/ConfigPage', () => ({
  ConfigPage: () => <div>Config mock</div>,
}));

vi.mock('@/pages/CustomersPage', () => ({
  default: () => <div>Clientes mock</div>,
}));

vi.mock('@/pages/WashingMachinesPage', () => ({
  default: () => <div>Lavadoras mock</div>,
}));

vi.mock('@/pages/FollowUpPage', () => ({
  FollowUpPage: () => <div>Seguimiento mock</div>,
}));

vi.mock('@/pages/ExchangeHistoryPage', () => ({
  ExchangeHistoryPage: () => <div>Historial mock</div>,
}));

vi.mock('@/pages/PrePaysPage', () => ({
  PrePaysPage: () => <div>Prepagados mock</div>,
}));

vi.mock('@/pages/DeliverysPage', () => ({
  DeliverysPage: () => <div>Entregas mock</div>,
}));

vi.mock('@/pages/WaterMetricsPage', () => ({
  WaterMetricsPage: () => <div>Métricas mock</div>,
}));

vi.mock('@/pages/PaymentBalancePage/index', () => ({
  PaymentBalancePage: () => <div>Equilibrio mock</div>,
}));

vi.mock('@/pages/TransactionsSummaryPage', () => ({
  TransactionsSummaryPage: () => <div>Transacciones mock</div>,
}));

vi.mock('@/pages/PaymentMethodDetailPage', () => ({
  PaymentMethodDetailPage: () => <div>Detalle pago mock</div>,
}));

describe('Index responsive shell', () => {
  it('keeps mobile shell without grid tablet classes under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isMobileViewport = true;
    viewportState.isTabletViewport = false;

    render(<Index />);

    const shell = screen.getByTestId('app-shell-layout');

    expect(shell).toHaveAttribute('data-viewport-mode', 'mobile');
    expect(shell).not.toHaveClass('grid');
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('activates tablet shell grid tokens in tablet landscape', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(<Index />);

    const shell = screen.getByTestId('app-shell-layout');

    expect(shell).toHaveAttribute('data-viewport-mode', 'tablet-landscape');
    expect(shell).toHaveClass('grid');
    expect(screen.getByTestId('tablet-navigation-rail')).toBeInTheDocument();
    // BottomNav and MenuSheet are mobile-only — must NOT appear on tablet
    expect(screen.queryByTestId('bottom-nav')).toBeNull();
    expect(screen.queryByTestId('menu-sheet')).toBeNull();
  });
});
