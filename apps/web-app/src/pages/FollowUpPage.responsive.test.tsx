import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { FollowUpPage } from './FollowUpPage';

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

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({
    rentals: [],
    updateRental: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/store/useMachineStore', () => ({
  useMachineStore: () => ({ washingMachines: [] }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('@/components/rentals/ExtensionDialog', () => ({
  ExtensionDialog: () => <div>ExtensionDialog</div>,
}));

describe('FollowUpPage responsive secondary flow', () => {
  it('renders split columns on tablet viewport', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isTabletViewport = true;
    viewportState.isMobileViewport = false;

    render(<FollowUpPage />);

    expect(screen.getByTestId('followup-primary-column')).toBeInTheDocument();
    expect(screen.getByTestId('followup-secondary-column')).toBeInTheDocument();
  });

  it('keeps mobile stack under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isTabletViewport = false;
    viewportState.isMobileViewport = true;

    render(<FollowUpPage />);

    expect(
      screen.queryByTestId('followup-primary-column')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('followup-secondary-column')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Lista priorizada')).toBeInTheDocument();
  });
});
