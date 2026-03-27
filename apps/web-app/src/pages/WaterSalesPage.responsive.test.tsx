import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { WaterSalesPage } from './WaterSalesPage';

const viewportState = vi.hoisted(() => ({
  viewportMode: 'mobile' as
    | 'mobile'
    | 'tablet-portrait'
    | 'tablet-landscape'
    | 'desktop-or-other',
  isMobileViewport: true,
  isTabletViewport: false,
}));

const waterSalesState = vi.hoisted(() => ({
  sales: [{ id: 'sale-1' }],
  cart: [{ subtotal: 20 }],
  loadSalesByDate: vi.fn().mockResolvedValue(undefined),
}));

const appStoreState = vi.hoisted(() => ({
  selectedDate: '2026-03-07',
  setSelectedDate: vi.fn(),
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => viewportState,
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => appStoreState,
}));
vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => ({
    getSalesByDate: () => waterSalesState.sales,
    cart: waterSalesState.cart,
    loadSalesByDate: waterSalesState.loadSalesByDate,
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: () => <div data-testid="mock-date-selector">Date</div>,
}));
vi.mock('@/components/ventas/PaymentFilter', () => ({
  PaymentFilter: () => <div data-testid="mock-payment-filter">Filter</div>,
}));
vi.mock('@/components/ventas/SalesList', () => ({
  SalesList: () => <div data-testid="mock-sales-list">SalesList</div>,
}));
vi.mock('@/components/ventas/AddProductSheet', () => ({
  AddProductSheet: () => <div>AddSheet</div>,
}));
vi.mock('@/components/ventas/CartSheet', () => ({
  CartSheet: () => <div>CartSheet</div>,
}));

describe('WaterSalesPage responsive tablet core', () => {
  it('enforces tablet baseline hierarchy with explicit audit checkpoints', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;
    waterSalesState.sales = [{ id: 'sale-1' }];
    waterSalesState.cart = [{ subtotal: 20 }];
    waterSalesState.loadSalesByDate = vi.fn().mockResolvedValue(undefined);
    appStoreState.selectedDate = '2026-03-07';

    render(<WaterSalesPage />);

    const controlsRegion = screen.getByTestId('water-sales-tablet-controls');
    const recordsRegion = screen.getByTestId('water-sales-records-region');
    const cartRegion = screen.getByTestId('water-sales-cart-region');
    const primaryColumn = screen.getByTestId('water-sales-primary-column');

    expect(controlsRegion).toHaveAttribute('data-audit-order', '1');
    expect(cartRegion).toHaveAttribute('data-audit-order', '2');
    expect(recordsRegion).toHaveAttribute('data-audit-order', '3');

    const controlsHtml = (controlsRegion as unknown as { innerHTML: string })
      .innerHTML;
    expect(controlsHtml.indexOf('Date')).toBeLessThan(
      controlsHtml.indexOf('Filter')
    );

    const primaryHtml = (primaryColumn as unknown as { innerHTML: string })
      .innerHTML;
    expect(primaryHtml.indexOf('Date')).toBeLessThan(
      primaryHtml.indexOf('SalesList')
    );
    expect(primaryHtml.indexOf('Filter')).toBeLessThan(
      primaryHtml.indexOf('SalesList')
    );
    expect(screen.getByText(/Bs 20/)).toBeInTheDocument();
  });

  it('renders tablet split with sidebar cart action in tablet mode', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;
    waterSalesState.sales = [{ id: 'sale-1' }];
    waterSalesState.cart = [{ subtotal: 20 }];
    waterSalesState.loadSalesByDate = vi.fn().mockResolvedValue(undefined);
    appStoreState.selectedDate = '2026-03-07';

    render(<WaterSalesPage />);

    expect(
      screen.getByTestId('water-sales-primary-column')
    ).toBeInTheDocument();
    expect(screen.getByTestId('water-sales-cart-region')).toBeInTheDocument();
    const primaryHtml = (
      screen.getByTestId('water-sales-primary-column') as unknown as {
        innerHTML: string;
      }
    ).innerHTML;
    expect(primaryHtml.indexOf('Date')).toBeLessThan(
      primaryHtml.indexOf('Filter')
    );
    expect(primaryHtml.indexOf('Filter')).toBeLessThan(
      primaryHtml.indexOf('SalesList')
    );
    expect(screen.getByText(/Bs 20/)).toBeInTheDocument();
  });

  it('keeps hierarchy consistent with empty cart and empty records', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;
    waterSalesState.sales = [];
    waterSalesState.cart = [];
    waterSalesState.loadSalesByDate = vi.fn().mockResolvedValue(undefined);
    appStoreState.selectedDate = '';

    render(<WaterSalesPage />);

    expect(screen.getByTestId('water-sales-cart-region')).toHaveAttribute(
      'data-audit-order',
      '2'
    );
    expect(screen.getByTestId('water-sales-records-region')).toHaveAttribute(
      'data-audit-order',
      '3'
    );
    expect(screen.getByText(/Carrito vacío/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-sales-list')).toBeInTheDocument();
  });

  it('keeps hierarchy consistent when loading without records', async () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;
    waterSalesState.sales = [];
    waterSalesState.cart = [];
    waterSalesState.loadSalesByDate = vi.fn(
      () => new Promise<void>(() => undefined)
    );
    appStoreState.selectedDate = '2026-03-07';

    render(<WaterSalesPage />);

    expect(await screen.findByText('Cargando ventas...')).toBeInTheDocument();
    expect(screen.getByTestId('water-sales-cart-region')).toHaveAttribute(
      'data-audit-order',
      '2'
    );
    expect(screen.getByTestId('water-sales-records-region')).toHaveAttribute(
      'data-audit-order',
      '3'
    );
  });

  it('keeps hierarchy consistent with cart items and empty list', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;
    waterSalesState.sales = [];
    waterSalesState.cart = [{ subtotal: 45 }, { subtotal: 10 }];
    waterSalesState.loadSalesByDate = vi.fn().mockResolvedValue(undefined);
    appStoreState.selectedDate = '';

    render(<WaterSalesPage />);

    expect(screen.getByTestId('water-sales-cart-region')).toHaveAttribute(
      'data-audit-order',
      '2'
    );
    expect(screen.getByText(/2 productos/)).toBeInTheDocument();
    expect(screen.getByText(/Bs 55/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-sales-list')).toBeInTheDocument();
  });

  it('keeps mobile floating cart button under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;
    waterSalesState.sales = [{ id: 'sale-1' }];
    waterSalesState.cart = [{ subtotal: 20 }];
    waterSalesState.loadSalesByDate = vi.fn().mockResolvedValue(undefined);
    appStoreState.selectedDate = '2026-03-07';

    render(<WaterSalesPage />);

    expect(
      screen.queryByTestId('water-sales-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('water-sales-cart-region')
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Bs 20/)).toBeInTheDocument();
    expect(
      screen.queryByTestId('water-sales-tablet-controls')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('water-sales-records-region')
    ).not.toBeInTheDocument();
  });
});
