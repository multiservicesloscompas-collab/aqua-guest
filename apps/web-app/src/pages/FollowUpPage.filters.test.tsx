import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { WasherRental } from '@/types';

import { FollowUpPage } from './FollowUpPage';

const rentalState = vi.hoisted(() => ({
  rentals: [] as WasherRental[],
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => ({
    viewportMode: 'mobile' as const,
    isMobileViewport: true,
    isTabletViewport: false,
  }),
}));

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({
    rentals: rentalState.rentals,
    updateRental: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/store/useMachineStore', () => ({
  useMachineStore: () => ({
    washingMachines: [
      {
        id: 'machine-1',
        name: 'Lavadora 1',
        kg: 12,
        status: 'disponible',
        isAvailable: true,
      },
    ],
  }),
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('@/components/rentals/ExtensionDialog', () => ({
  ExtensionDialog: () => <div>ExtensionDialog</div>,
}));

function createRental(overrides: Partial<WasherRental>): WasherRental {
  return {
    id: overrides.id ?? 'rental-id',
    date: overrides.date ?? '2026-03-17',
    customerId: overrides.customerId ?? 'customer-id',
    customerName: overrides.customerName ?? 'Cliente',
    customerPhone: overrides.customerPhone ?? '0414-0000000',
    customerAddress: overrides.customerAddress ?? 'Direccion',
    machineId: overrides.machineId ?? 'machine-1',
    shift: overrides.shift ?? 'completo',
    deliveryTime: overrides.deliveryTime ?? '10:00',
    pickupTime: overrides.pickupTime ?? '14:00',
    pickupDate: overrides.pickupDate ?? '2026-03-17',
    deliveryFee: overrides.deliveryFee ?? 0,
    totalUsd: overrides.totalUsd ?? 6,
    paymentMethod: overrides.paymentMethod ?? 'efectivo',
    status: overrides.status ?? 'agendado',
    isPaid: overrides.isPaid ?? false,
    createdAt: overrides.createdAt ?? '2026-03-17T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-17T10:00:00.000Z',
    ...overrides,
  };
}

describe('FollowUpPage filters', () => {
  beforeEach(() => {
    rentalState.rentals = [
      createRental({ id: 'rental-1', customerName: 'Ana', isPaid: false }),
      createRental({
        id: 'rental-2',
        customerName: 'Beto',
        isPaid: true,
        status: 'enviado',
      }),
      createRental({
        id: 'rental-3',
        customerName: 'Carla',
        isPaid: false,
        status: 'finalizado',
      }),
    ];
  });

  it('En proceso excludes finalized rentals', async () => {
    const user = userEvent.setup();

    render(<FollowUpPage />);
    await user.click(screen.getByRole('button', { name: 'En proceso' }));

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.queryByText('Carla')).not.toBeInTheDocument();
    expect(screen.getAllByText('No pagado')).toHaveLength(1);
  });

  it('Por pagar includes unpaid rentals regardless of status', async () => {
    const user = userEvent.setup();

    render(<FollowUpPage />);
    await user.click(screen.getByRole('button', { name: 'Por pagar' }));

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
    expect(screen.queryByText('Beto')).not.toBeInTheDocument();
    expect(screen.getAllByText('No pagado')).toHaveLength(2);
  });

  it('Todos renders deduped union without duplicate ids', () => {
    render(<FollowUpPage />);

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();
    expect(screen.getAllByText('Ana')).toHaveLength(1);
    expect(screen.getAllByText('No pagado')).toHaveLength(2);
  });
});
