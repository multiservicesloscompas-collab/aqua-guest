/* @vitest-environment jsdom */

import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Tip } from '@/types/tips';
import type { WasherRental } from '@/types';
import { useEditRentalTipHydration } from './useEditRentalTipHydration';

const { loadTipsByDateRangeMock, setCurrentTips, useTipStoreMock } = vi.hoisted(
  () => {
    let currentTips: Tip[] = [];
    const loadTipsByDateRangeMock = vi.fn();

    const useTipStoreMock = Object.assign(
      () =>
        ({
          tips: currentTips,
          loadTipsByDateRange: loadTipsByDateRangeMock,
        } as TipStoreSnapshot),
      {
        getState: () => ({ tips: currentTips }),
      }
    );

    return {
      loadTipsByDateRangeMock,
      setCurrentTips: (tips: Tip[]) => {
        currentTips = tips;
      },
      useTipStoreMock,
    };
  }
);

type TipStoreSnapshot = {
  tips: Tip[];
  loadTipsByDateRange: typeof loadTipsByDateRangeMock;
};

vi.mock('@/store/useTipStore', () => ({
  useTipStore: useTipStoreMock,
}));

type TipCaptureMockApi = {
  hydrateTipCapture: (input: {
    amountBs: number;
    paymentMethod: 'pago_movil' | 'efectivo' | 'punto_venta' | 'divisa';
    notes?: string;
  }) => void;
  resetTipCapture: () => void;
};

function buildRental(id: string, date = '2026-03-15'): WasherRental {
  return {
    id,
    date,
    customerId: 'customer-1',
    customerName: 'Cliente',
    customerPhone: '0414',
    customerAddress: 'Centro',
    machineId: 'machine-1',
    shift: 'medio',
    deliveryTime: '09:00',
    pickupTime: '13:00',
    pickupDate: date,
    deliveryFee: 0,
    totalUsd: 2,
    paymentMethod: 'efectivo',
    status: 'agendado',
    isPaid: false,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

function buildTip(originId: string, amountBs: number): Tip {
  return {
    id: `tip-${originId}`,
    originType: 'rental',
    originId,
    tipDate: '2026-03-15',
    amountBs,
    capturePaymentMethod: 'pago_movil',
    status: 'pending',
    notes: `nota-${originId}`,
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
  };
}

function Harness({
  open,
  rental,
  tipCapture,
}: {
  open: boolean;
  rental: WasherRental | null;
  tipCapture: TipCaptureMockApi;
}) {
  useEditRentalTipHydration({
    open,
    rental,
    tipCapture,
  });
  return null;
}

describe('useEditRentalTipHydration', () => {
  beforeEach(() => {
    setCurrentTips([]);
    loadTipsByDateRangeMock.mockReset();
  });

  it('hydrates tip capture from linked cached tip', async () => {
    const tipCapture = {
      hydrateTipCapture: vi.fn(),
      resetTipCapture: vi.fn(),
    };
    setCurrentTips([buildTip('rental-1', 35)]);

    render(
      <Harness
        open={true}
        rental={buildRental('rental-1')}
        tipCapture={tipCapture}
      />
    );

    await waitFor(() => {
      expect(tipCapture.hydrateTipCapture).toHaveBeenCalledWith({
        amountBs: 35,
        paymentMethod: 'pago_movil',
        notes: 'nota-rental-1',
      });
    });
    expect(loadTipsByDateRangeMock).not.toHaveBeenCalled();
  });

  it('keeps default state when no tip exists', async () => {
    const tipCapture = {
      hydrateTipCapture: vi.fn(),
      resetTipCapture: vi.fn(),
    };
    loadTipsByDateRangeMock.mockResolvedValueOnce(undefined);

    render(
      <Harness
        open={true}
        rental={buildRental('rental-2')}
        tipCapture={tipCapture}
      />
    );

    await waitFor(() => {
      expect(loadTipsByDateRangeMock).toHaveBeenCalledWith(
        '2026-03-15',
        '2026-03-15'
      );
    });
    await waitFor(() => {
      expect(tipCapture.resetTipCapture).toHaveBeenCalled();
    });
    expect(tipCapture.hydrateTipCapture).not.toHaveBeenCalled();
  });

  it('prevents stale hydration when switching rentals A to B', async () => {
    const tipCapture = {
      hydrateTipCapture: vi.fn(),
      resetTipCapture: vi.fn(),
    };

    let resolveA: (() => void) | undefined;
    let resolveB: (() => void) | undefined;
    loadTipsByDateRangeMock
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveA = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveB = resolve;
          })
      );

    const { rerender } = render(
      <Harness
        open={true}
        rental={buildRental('rental-a')}
        tipCapture={tipCapture}
      />
    );

    rerender(
      <Harness
        open={true}
        rental={buildRental('rental-b')}
        tipCapture={tipCapture}
      />
    );

    setCurrentTips([buildTip('rental-a', 20)]);
    resolveA?.();
    await Promise.resolve();

    expect(tipCapture.hydrateTipCapture).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountBs: 20 })
    );

    setCurrentTips([buildTip('rental-b', 55)]);
    resolveB?.();

    await waitFor(() => {
      expect(tipCapture.hydrateTipCapture).toHaveBeenCalledWith({
        amountBs: 55,
        paymentMethod: 'pago_movil',
        notes: 'nota-rental-b',
      });
    });
  });

  it('resets on close and hydrates deterministically on reopen', async () => {
    const tipCapture = {
      hydrateTipCapture: vi.fn(),
      resetTipCapture: vi.fn(),
    };
    setCurrentTips([buildTip('rental-1', 18)]);

    const { rerender } = render(
      <Harness
        open={true}
        rental={buildRental('rental-1')}
        tipCapture={tipCapture}
      />
    );

    await waitFor(() => {
      expect(tipCapture.hydrateTipCapture).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Harness
        open={false}
        rental={buildRental('rental-1')}
        tipCapture={tipCapture}
      />
    );
    await waitFor(() => {
      expect(tipCapture.resetTipCapture).toHaveBeenCalled();
    });

    rerender(
      <Harness
        open={true}
        rental={buildRental('rental-1')}
        tipCapture={tipCapture}
      />
    );
    await waitFor(() => {
      expect(tipCapture.hydrateTipCapture).toHaveBeenCalledTimes(2);
    });
  });
});
