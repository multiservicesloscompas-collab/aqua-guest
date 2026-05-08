import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRentalStore } from './useRentalStore';
import { useConfigStore } from './useConfigStore';
import { useTipStore } from './useTipStore';

const {
  addRentalActionMock,
  deleteRentalActionMock,
  updateRentalActionMock,
  upsertTipForOriginMock,
  deleteTipByOriginMock,
  toTipPayoutReadModelMock,
} = vi.hoisted(() => ({
  addRentalActionMock: vi.fn(),
  deleteRentalActionMock: vi.fn(),
  updateRentalActionMock: vi.fn(),
  upsertTipForOriginMock: vi.fn(),
  deleteTipByOriginMock: vi.fn(),
  toTipPayoutReadModelMock: vi.fn(),
}));

vi.mock('./useRentalStore.actions', () => ({
  addRentalAction: addRentalActionMock,
  updateRentalAction: updateRentalActionMock,
  deleteRentalAction: deleteRentalActionMock,
}));

vi.mock('@/services/tips/TipDataService', () => ({
  tipsDataService: {
    deleteTipByOrigin: deleteTipByOriginMock,
    upsertTipForOrigin: upsertTipForOriginMock,
    toTipPayoutReadModel: toTipPayoutReadModelMock,
  },
}));

vi.mock('@/services/RentalsDataService', () => ({
  rentalsDataService: {
    loadRentalsByDate: vi.fn(),
    loadRentalsByDateRange: vi.fn(async () => new Map()),
  },
}));

vi.mock('@/services/payments/paymentSplitWritePath', () => ({
  preparePaymentWritePayload: vi.fn(() => ({
    paymentMethod: 'efectivo',
    paymentSplits: [],
    validation: { ok: true, errors: [] },
  })),
}));

vi.mock('./useRentalStore.supabase', () => ({
  replaceRentalSplits: vi.fn(),
  fetchRentalSplits: vi.fn(async () => []),
}));

describe('useRentalStore tip integration', () => {
  beforeEach(() => {
    addRentalActionMock.mockReset();
    deleteRentalActionMock.mockReset();
    updateRentalActionMock.mockReset();
    deleteTipByOriginMock.mockReset();
    upsertTipForOriginMock.mockReset();
    toTipPayoutReadModelMock.mockReset();
    toTipPayoutReadModelMock.mockReturnValue([]);

    useRentalStore.setState({
      rentals: [
        {
          id: 'rental-1',
          date: '2026-03-13',
          customerId: 'customer-1',
          customerName: 'Cliente Uno',
          customerPhone: '0414',
          customerAddress: 'Centro',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-13',
          deliveryFee: 0,
          totalUsd: 2,
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: false,
          createdAt: '2026-03-13T08:00:00.000Z',
          updatedAt: '2026-03-13T08:00:00.000Z',
        },
      ],
      loadingRentalsByRange: {},
    });

    useConfigStore.setState((state) => ({
      config: {
        ...state.config,
        exchangeRate: 50,
      },
    }));

    useTipStore.setState({
      tips: [],
      tipPayouts: [],
      loadingByRange: {},
    });
  });

  it('creates rental tip linked to new rental origin', async () => {
    upsertTipForOriginMock.mockResolvedValueOnce({
      id: 'tip-created',
      originType: 'rental',
      originId: 'rental-new-1',
      tipDate: '2026-03-13',
      amountBs: 10,
      amountUsd: 0.2,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      status: 'pending',
      notes: 'bono extra',
      createdAt: '2026-03-13T09:00:00.000Z',
      updatedAt: '2026-03-13T09:00:00.000Z',
    });

    addRentalActionMock.mockResolvedValueOnce({
      id: 'rental-new-1',
      date: '2026-03-13',
      customerId: 'customer-1',
      customerName: 'Cliente Uno',
      customerPhone: '0414',
      customerAddress: 'Centro',
      machineId: 'machine-1',
      shift: 'medio',
      deliveryTime: '10:00',
      pickupTime: '14:00',
      pickupDate: '2026-03-13',
      deliveryFee: 0,
      totalUsd: 2,
      paymentMethod: 'efectivo',
      status: 'agendado',
      isPaid: false,
      createdAt: '2026-03-13T09:00:00.000Z',
      updatedAt: '2026-03-13T09:00:00.000Z',
    });

    await useRentalStore.getState().addRental(
      {
        date: '2026-03-13',
        customerId: 'customer-1',
        customerName: 'Cliente Uno',
        customerPhone: '0414',
        customerAddress: 'Centro',
        machineId: 'machine-1',
        shift: 'medio',
        deliveryTime: '10:00',
        pickupTime: '14:00',
        pickupDate: '2026-03-13',
        deliveryFee: 0,
        totalUsd: 2,
        paymentMethod: 'efectivo',
        status: 'agendado',
        isPaid: false,
      },
      {
        amountBs: 10,
        capturePaymentMethod: 'pago_movil',
        notes: 'bono extra',
      }
    );

    expect(upsertTipForOriginMock).toHaveBeenCalledWith({
      originType: 'rental',
      originId: 'rental-new-1',
      tipDate: '2026-03-13',
      amountBs: 10,
      amountUsd: 0.2,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      notes: 'bono extra',
    });
    expect(useTipStore.getState().tips).toHaveLength(1);
    expect(useTipStore.getState().tips[0]?.originId).toBe('rental-new-1');
  });

  it('updates rental tip preserving mandatory rental origin link', async () => {
    upsertTipForOriginMock.mockResolvedValueOnce({
      id: 'tip-updated',
      originType: 'rental',
      originId: 'rental-1',
      tipDate: '2026-03-13',
      amountBs: 15,
      amountUsd: 0.3,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'efectivo',
      status: 'pending',
      createdAt: '2026-03-13T08:00:00.000Z',
      updatedAt: '2026-03-13T08:05:00.000Z',
    });

    updateRentalActionMock.mockResolvedValueOnce(undefined);

    await useRentalStore.getState().updateRental(
      'rental-1',
      { notes: 'editado' },
      {
        amountBs: 15,
        capturePaymentMethod: 'efectivo',
      }
    );

    expect(upsertTipForOriginMock).toHaveBeenCalledWith({
      originType: 'rental',
      originId: 'rental-1',
      tipDate: '2026-03-13',
      amountBs: 15,
      amountUsd: 0.3,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'efectivo',
      notes: undefined,
    });
    expect(useTipStore.getState().tips).toHaveLength(1);
    expect(useTipStore.getState().tips[0]?.amountBs).toBe(15);
  });

  it('deletes rental tip by origin when deleting a rental', async () => {
    deleteRentalActionMock.mockResolvedValueOnce(undefined);

    await useRentalStore.getState().deleteRental('rental-1');

    expect(deleteRentalActionMock).toHaveBeenCalledTimes(1);
    const deleteTipArg = deleteRentalActionMock.mock.calls[0][3];
    expect(typeof deleteTipArg).toBe('function');

    await deleteTipArg('rental', 'rental-1');
    expect(deleteTipByOriginMock).toHaveBeenCalledWith('rental', 'rental-1');
  });
});
