/* @vitest-environment jsdom */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Sale, WasherRental } from '@/types';
import type { Tip } from '@/types/tips';

import { TipsPage } from './index';

const appStoreState = vi.hoisted(() => ({
  selectedDate: '2026-03-13',
  setSelectedDate: vi.fn(),
}));

const tipStoreState = vi.hoisted(() => ({
  tips: [] as Tip[],
  loadTipsByDateRange: vi.fn(),
  updateTipNote: vi.fn(),
  paySingleTip: vi.fn(),
}));

const waterSalesState = vi.hoisted(() => ({
  sales: [] as Array<Pick<Sale, 'id' | 'dailyNumber'>>,
  loadSalesByDate: vi.fn().mockResolvedValue(undefined),
}));

const rentalState = vi.hoisted(() => ({
  rentals: [] as Array<Pick<WasherRental, 'id' | 'customerName'>>,
  loadRentalsByDate: vi.fn().mockResolvedValue(undefined),
}));

const toastState = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: (selector: (state: typeof appStoreState) => unknown) =>
    selector(appStoreState),
}));

vi.mock('@/store/useTipStore', () => ({
  useTipStore: (selector?: (state: typeof tipStoreState) => unknown) =>
    selector ? selector(tipStoreState) : tipStoreState,
}));

vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: (selector: (state: typeof waterSalesState) => unknown) =>
    selector(waterSalesState),
}));

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: (selector: (state: typeof rentalState) => unknown) =>
    selector(rentalState),
}));

vi.mock('sonner', () => ({
  toast: toastState,
}));

vi.mock('@/components/ventas/DateSelector', () => ({
  DateSelector: ({
    selectedDate,
    onDateChange,
  }: {
    selectedDate: string;
    onDateChange: (value: string) => void;
  }) => (
    <div data-testid="tip-date-selector">
      <button onClick={() => onDateChange('2026-03-12')}>prev-day</button>
      <span>{selectedDate}</span>
      <button onClick={() => onDateChange('2026-03-14')}>next-day</button>
    </div>
  ),
}));

describe('TipsPage', () => {
  beforeEach(() => {
    appStoreState.selectedDate = '2026-03-13';
    appStoreState.setSelectedDate.mockReset();
    tipStoreState.tips = [];
    tipStoreState.loadTipsByDateRange.mockReset();
    tipStoreState.updateTipNote.mockReset();
    tipStoreState.paySingleTip.mockReset();
    waterSalesState.sales = [];
    waterSalesState.loadSalesByDate.mockReset();
    waterSalesState.loadSalesByDate.mockResolvedValue(undefined);
    rentalState.rentals = [];
    rentalState.loadRentalsByDate.mockReset();
    rentalState.loadRentalsByDate.mockResolvedValue(undefined);
    toastState.success.mockReset();
    toastState.error.mockReset();
  });

  it('loads tips by selected day and allows day navigation', () => {
    render(<TipsPage />);

    expect(tipStoreState.loadTipsByDateRange).toHaveBeenCalledWith(
      '2026-03-13',
      '2026-03-13'
    );
    expect(waterSalesState.loadSalesByDate).toHaveBeenCalledWith('2026-03-13');
    expect(rentalState.loadRentalsByDate).toHaveBeenCalledWith('2026-03-13');
    expect(screen.getByText('2026-03-13')).toBeInTheDocument();

    fireEvent.click(screen.getByText('prev-day'));
    expect(appStoreState.setSelectedDate).toHaveBeenCalledWith('2026-03-12');

    fireEvent.click(screen.getByText('next-day'));
    expect(appStoreState.setSelectedDate).toHaveBeenCalledWith('2026-03-14');
  });

  it('renders transaction linkage and status per tip with fallback when missing', () => {
    tipStoreState.tips = [
      {
        id: 'tip-sale',
        originType: 'sale',
        originId: 'sale-1',
        tipDate: '2026-03-13',
        amountBs: 20,
        capturePaymentMethod: 'efectivo',
        status: 'pending',
        createdAt: '2026-03-13T10:00:00.000Z',
        updatedAt: '2026-03-13T10:00:00.000Z',
      },
      {
        id: 'tip-rental',
        originType: 'rental',
        originId: 'rental-1',
        tipDate: '2026-03-14T01:30:00.000Z',
        amountBs: 12,
        capturePaymentMethod: 'pago_movil',
        status: 'paid',
        createdAt: '2026-03-13T11:00:00.000Z',
        updatedAt: '2026-03-13T11:00:00.000Z',
      },
      {
        id: 'tip-unknown',
        originType: 'sale',
        originId: 'sale-missing',
        tipDate: '2026-03-13',
        amountBs: 8,
        capturePaymentMethod: 'efectivo',
        status: 'pending',
        createdAt: '2026-03-13T11:30:00.000Z',
        updatedAt: '2026-03-13T11:30:00.000Z',
      },
    ];

    waterSalesState.sales = [{ id: 'sale-1', dailyNumber: 17 }];
    rentalState.rentals = [{ id: 'rental-1', customerName: 'Ana Perez' }];

    render(<TipsPage />);

    expect(screen.getByText('Venta #17')).toBeInTheDocument();
    expect(screen.getByText('Alquiler - Ana Perez')).toBeInTheDocument();
    expect(
      screen.getByText('Origen no disponible (sale: sale-missing)')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Pendiente')).toHaveLength(2);
    expect(screen.getAllByText('Pagada').length).toBeGreaterThan(0);
    expect(screen.getByText('Registros')).toBeInTheDocument();
    expect(screen.getByText('Bs 40,00')).toBeInTheDocument();
  });

  it('edits a tip note and persists through tip store action', async () => {
    tipStoreState.tips = [
      {
        id: 'tip-1',
        originType: 'sale',
        originId: 'sale-1',
        tipDate: '2026-03-13',
        amountBs: 20,
        capturePaymentMethod: 'efectivo',
        status: 'pending',
        notes: 'nota inicial',
        createdAt: '2026-03-13T10:00:00.000Z',
        updatedAt: '2026-03-13T10:00:00.000Z',
      },
    ];

    tipStoreState.updateTipNote.mockResolvedValue(undefined);

    render(<TipsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Nota' }));
    fireEvent.change(screen.getByLabelText('Nota de propina'), {
      target: { value: 'nota actualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Nota' }));

    await waitFor(() => {
      expect(tipStoreState.updateTipNote).toHaveBeenCalledWith(
        'tip-1',
        'nota actualizada'
      );
    });
    expect(toastState.success).toHaveBeenCalled();
  });

  it('pays a single pending tip from card action', async () => {
    tipStoreState.tips = [
      {
        id: 'tip-pay-1',
        originType: 'sale',
        originId: 'sale-1',
        tipDate: '2026-03-13',
        amountBs: 35,
        capturePaymentMethod: 'pago_movil', // original method
        status: 'pending',
        createdAt: '2026-03-13T10:00:00.000Z',
        updatedAt: '2026-03-13T10:00:00.000Z',
      },
    ];
    tipStoreState.paySingleTip.mockResolvedValue(undefined);

    render(<TipsPage />);

    // Click "Pagar" on the card
    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));

    // Drawer opens, click "Confirmar Pago" (it defaults to efectivo)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }));

    await waitFor(() => {
      expect(tipStoreState.paySingleTip).toHaveBeenCalledWith({
        tipId: 'tip-pay-1',
        tipDate: '2026-03-13',
        paymentMethod: 'efectivo',
        paidAt: expect.stringMatching(/^2026-03-13T12:00:00Z$/),
      });
    });
  });

  it('pays all pending tips for selected day', async () => {
    tipStoreState.tips = [
      {
        id: 'tip-pay-all-1',
        originType: 'sale',
        originId: 'sale-1',
        tipDate: '2026-03-13',
        amountBs: 12,
        capturePaymentMethod: 'efectivo',
        status: 'pending',
        createdAt: '2026-03-13T10:00:00.000Z',
        updatedAt: '2026-03-13T10:00:00.000Z',
      },
      {
        id: 'tip-pay-all-2',
        originType: 'rental',
        originId: 'rental-1',
        tipDate: '2026-03-13',
        amountBs: 18,
        capturePaymentMethod: 'pago_movil',
        status: 'pending',
        createdAt: '2026-03-13T10:30:00.000Z',
        updatedAt: '2026-03-13T10:30:00.000Z',
      },
    ];
    tipStoreState.paySingleTip.mockResolvedValue(undefined);

    render(<TipsPage />);

    // Click pay all button
    fireEvent.click(
      screen.getByRole('button', { name: 'Pagar Todas del Dia' })
    );

    // Click another method in the drawer, e.g. Divisa
    fireEvent.click(screen.getByTestId('tip-payment-method-divisa'));
    
    // Confirm payment
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }));

    await waitFor(() => {
      expect(tipStoreState.paySingleTip).toHaveBeenCalledWith({
        tipId: 'tip-pay-all-1',
        tipDate: '2026-03-13',
        paymentMethod: 'divisa',
        paidAt: expect.stringMatching(/^2026-03-13T12:00:00Z$/),
      });
    });

    expect(tipStoreState.paySingleTip).toHaveBeenCalledWith({
      tipId: 'tip-pay-all-2',
      tipDate: '2026-03-13',
      paymentMethod: 'divisa',
      paidAt: expect.stringMatching(/^2026-03-13T12:00:00Z$/),
    });
  });
});
