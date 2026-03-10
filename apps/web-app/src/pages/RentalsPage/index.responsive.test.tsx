import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RentalsPage } from './index';

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

vi.mock('./hooks/useRentalsPageViewModel', () => ({
  useRentalsPageViewModel: () => ({
    selectedDate: '2026-03-07',
    setSelectedDate: vi.fn(),
    rentals: [{ id: 'r-1' }],
    summary: { activeCount: 1, totalText: '$10', paidText: '$5' },
    loadingRentals: false,
    sheetOpen: false,
    setSheetOpen: vi.fn(),
    openSheet: vi.fn(),
  }),
}));

vi.mock('./hooks/useRentalListViewModel', () => ({
  useRentalListViewModel: () => ({
    rentals: [{ id: 'r-1' }],
    editingRental: null,
    editSheetOpen: false,
    setEditSheetOpen: vi.fn(),
    extensionDialogOpen: false,
    setExtensionDialogOpen: vi.fn(),
    selectedRental: null,
    handleStatusChange: vi.fn(),
    handlePaymentToggle: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleExtendRental: vi.fn(),
    handleExtensionApplied: vi.fn(),
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: () => <div>Date</div>,
}));
vi.mock('./components/RentalList', () => ({
  RentalList: () => <div>RentalList</div>,
}));
vi.mock('./components/RentalsSummaryCards', () => ({
  RentalsSummaryCards: () => <div>SummaryCards</div>,
}));
vi.mock('./components/RentalsLoadingState', () => ({
  RentalsLoadingState: () => <div>Loading</div>,
}));
vi.mock('./components/RentalsFab', () => ({
  RentalsFab: () => <button>Fab</button>,
}));
vi.mock('./components/RentalSheet', () => ({
  RentalSheet: () => <div>Sheet</div>,
}));

describe('RentalsPage responsive tablet core', () => {
  it('renders split columns in tablet mode', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<RentalsPage />);

    expect(screen.getByTestId('rentals-primary-column')).toBeInTheDocument();
    expect(screen.getByTestId('rentals-secondary-column')).toBeInTheDocument();
    const primaryHtml = (
      screen.getByTestId('rentals-primary-column') as unknown as {
        innerHTML: string;
      }
    ).innerHTML;
    expect(primaryHtml.indexOf('Date')).toBeLessThan(
      primaryHtml.indexOf('SummaryCards')
    );
    expect(primaryHtml.indexOf('SummaryCards')).toBeLessThan(
      primaryHtml.indexOf('RentalList')
    );
  });

  it('keeps mobile stack without split columns under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<RentalsPage />);

    expect(
      screen.queryByTestId('rentals-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('rentals-secondary-column')
    ).not.toBeInTheDocument();
  });
});
