/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from '@/store/useConfigStore';
import { useTipStore } from '@/store/useTipStore';
import type { Sale } from '@/types';
import type { Tip } from '@/types/tips';
import { useEditSaleSheetViewModel } from './useEditSaleSheetViewModel';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

const DATE = '2026-03-07';

const buildSale = (totalBs: number, splits: Sale['paymentSplits']): Sale => ({
  id: 'sale-1',
  dailyNumber: 1,
  date: DATE,
  items: [],
  paymentMethod: 'efectivo',
  paymentSplits: splits,
  totalBs,
  totalUsd: totalBs / 50,
  exchangeRate: 50,
  createdAt: `${DATE}T08:00:00.000Z`,
  updatedAt: `${DATE}T08:00:00.000Z`,
});

const buildTip = (amountBs: number): Tip => ({
  id: 'tip-1',
  originType: 'sale',
  originId: 'sale-1',
  tipDate: DATE,
  amountBs,
  capturePaymentMethod: 'pago_movil',
  status: 'pending',
  notes: 'nota',
  createdAt: `${DATE}T08:00:00.000Z`,
  updatedAt: `${DATE}T08:00:00.000Z`,
});

const plainSale = buildSale(1000, [
  { method: 'efectivo', amountBs: 1000, amountUsd: 20, exchangeRateUsed: 50 },
]);
const saleWithTip = buildSale(1200, [
  { method: 'efectivo', amountBs: 1000, amountUsd: 20, exchangeRateUsed: 50 },
  { method: 'pago_movil', amountBs: 200, amountUsd: 4, exchangeRateUsed: 50 },
]);

let finishLoad: () => void = () => undefined;
const loadTipsByDateRangeMock = vi.fn();

const renderEdit = (sale: Sale) =>
  renderHook(() =>
    useEditSaleSheetViewModel({ sale, open: true, onOpenChange: vi.fn() })
  );

describe('useEditSaleSheetViewModel hydration (B10)', () => {
  beforeEach(() => {
    useConfigStore.setState((state) => ({
      config: { ...state.config, exchangeRate: 50 },
    }));
    useTipStore.setState({
      tips: [],
      tipPayouts: [],
      loadTipsByDateRange: loadTipsByDateRangeMock,
    });
    loadTipsByDateRangeMock.mockReset().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishLoad = resolve;
        })
    );
  });

  it('keeps the subtotal the user typed while the tips are still loading', async () => {
    // Arrange
    const { result } = renderEdit(plainSale);
    expect(result.current.subtotalBs).toBe('1000');

    // Act: the user types before the tips request answers
    act(() => result.current.setSubtotalBs('1500'));
    await act(async () => finishLoad());

    // Assert
    expect(result.current.subtotalBs).toBe('1500');
  });

  it('still hydrates the tip when the user already typed a subtotal', async () => {
    const { result } = renderEdit(saleWithTip);

    act(() => result.current.setSubtotalBs('1500'));
    await act(async () => {
      useTipStore.setState({ tips: [buildTip(200)] });
      finishLoad();
    });

    expect(result.current.tipEnabled).toBe(true);
    expect(result.current.tipAmount).toBe('200');
    expect(result.current.subtotalBs).toBe('1500');
  });

  it('subtracts the tip from the subtotal when the user has not typed one', async () => {
    const { result } = renderEdit(saleWithTip);

    await act(async () => {
      useTipStore.setState({ tips: [buildTip(200)] });
      finishLoad();
    });

    expect(result.current.subtotalBs).toBe('1000');
    expect(result.current.tipEnabled).toBe(true);
  });

  it('does not overwrite a tip the user edited when the tip store updates again', async () => {
    const { result } = renderEdit(saleWithTip);
    await act(async () => {
      useTipStore.setState({ tips: [buildTip(200)] });
      finishLoad();
    });
    act(() => result.current.setTipAmount('300'));

    await act(async () => {
      useTipStore.setState({ tips: [{ ...buildTip(200), notes: 'otra' }] });
    });

    expect(result.current.tipAmount).toBe('300');
  });
});
