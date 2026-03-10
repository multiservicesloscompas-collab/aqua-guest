import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DeliverysPage } from './DeliverysPage';

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
  useAppStore: Object.assign(
    () => ({
      selectedDate: '2026-03-08',
      setSelectedDate: vi.fn(),
    }),
    {
      getState: () => ({
        loadFromSupabase: vi.fn().mockResolvedValue(undefined),
      }),
    }
  ),
}));

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({ rentals: [] }),
}));

vi.mock('@/store/useMachineStore', () => ({
  useMachineStore: () => ({ washingMachines: [] }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('./DeliverysPage/components/DeliveryFiltersCard', () => ({
  DeliveryFiltersCard: () => <div>Filters</div>,
}));
vi.mock('./DeliverysPage/components/DeliveryStatsGrid', () => ({
  DeliveryStatsGrid: () => <div data-testid="delivery-stats-grid">Stats</div>,
}));
vi.mock('./DeliverysPage/components/DeliveryListSection', () => ({
  DeliveryListSection: () => (
    <div data-testid="delivery-list-section">List</div>
  ),
}));

describe('DeliverysPage responsive secondary flow', () => {
  it('renders split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    const { container } = render(<DeliverysPage />);

    expect(screen.getByTestId('delivery-primary-column')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-secondary-column')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-primary-column')).toContainElement(
      screen.getByText('Filters')
    );
    expect(screen.getByTestId('delivery-secondary-column')).toContainElement(
      screen.getByText('Stats')
    );

    const pageHtml = (container as unknown as { innerHTML: string }).innerHTML;
    expect(pageHtml.indexOf('delivery-stats-grid')).toBeLessThan(
      pageHtml.indexOf('delivery-list-section')
    );
  });

  it('keeps mobile stack under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    const { container } = render(<DeliverysPage />);

    expect(
      screen.queryByTestId('delivery-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('delivery-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();

    const pageHtml = (container as unknown as { innerHTML: string }).innerHTML;
    expect(pageHtml.indexOf('delivery-stats-grid')).toBeLessThan(
      pageHtml.indexOf('delivery-list-section')
    );
  });
});
