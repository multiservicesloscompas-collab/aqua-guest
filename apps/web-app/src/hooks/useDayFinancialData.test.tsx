/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { useDayFinancialData } from './useDayFinancialData';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

const flush = () => act(async () => undefined);

describe('useDayFinancialData (FIN-06)', () => {
  const loaders = {
    loadSalesByDateRange: vi.fn(),
    loadRentalsByDateRange: vi.fn(),
    loadExpensesByDate: vi.fn(),
    loadPaidTipsByDateRange: vi.fn(),
  };

  beforeEach(() => {
    Object.values(loaders).forEach((loader) =>
      loader.mockReset().mockResolvedValue(undefined)
    );
    useAppStore.setState({ coreLoadedAt: 0 });
  });

  it('loads sales, rentals, expenses and paid tips of the selected date', async () => {
    // Act
    renderHook(() => useDayFinancialData('2026-02-28', loaders));
    await flush();

    // Assert
    expect(loaders.loadSalesByDateRange).toHaveBeenCalledWith(
      '2026-02-28',
      '2026-02-28'
    );
    expect(loaders.loadRentalsByDateRange).toHaveBeenCalledWith(
      '2026-02-28',
      '2026-02-28'
    );
    expect(loaders.loadExpensesByDate).toHaveBeenCalledWith('2026-02-28');
    expect(loaders.loadPaidTipsByDateRange).toHaveBeenCalledWith(
      '2026-02-28',
      '2026-02-28'
    );
  });

  it('loads again when the date changes', async () => {
    const { rerender } = renderHook(
      (props: { date: string }) => useDayFinancialData(props.date, loaders),
      { initialProps: { date: '2026-02-28' } }
    );
    await flush();

    rerender({ date: '2026-03-01' });
    await flush();

    expect(loaders.loadExpensesByDate).toHaveBeenCalledTimes(2);
    expect(loaders.loadExpensesByDate).toHaveBeenLastCalledWith('2026-03-01');
  });

  it('loads again after a global sync replaced the stores', async () => {
    renderHook(() => useDayFinancialData('2026-02-28', loaders));
    await flush();

    act(() => {
      useAppStore.setState({ coreLoadedAt: 1_000 });
    });
    await flush();

    expect(loaders.loadSalesByDateRange).toHaveBeenCalledTimes(2);
    expect(loaders.loadExpensesByDate).toHaveBeenCalledTimes(2);
  });

  it('does not load again when nothing changed', async () => {
    const { rerender } = renderHook(() =>
      useDayFinancialData('2026-02-28', loaders)
    );
    await flush();

    rerender();
    await flush();

    expect(loaders.loadExpensesByDate).toHaveBeenCalledTimes(1);
  });

  it('tolerates missing loaders and failing loaders', async () => {
    loaders.loadSalesByDateRange.mockRejectedValue(new Error('network'));

    expect(() =>
      renderHook(() =>
        useDayFinancialData('2026-02-28', {
          loadSalesByDateRange: loaders.loadSalesByDateRange,
        })
      )
    ).not.toThrow();
    await flush();
    expect(loaders.loadExpensesByDate).not.toHaveBeenCalled();
  });
});
