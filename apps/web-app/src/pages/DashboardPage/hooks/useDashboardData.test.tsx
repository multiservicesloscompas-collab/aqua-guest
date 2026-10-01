/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { useDashboardData } from './useDashboardData';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

const flush = () => act(async () => undefined);

describe('useDashboardData (FIN-12)', () => {
  const loaders = {
    loadSalesByDateRange: vi.fn(),
    loadExpensesByDateRange: vi.fn(),
    loadRentalsByDateRange: vi.fn(),
    loadTipsByDateRange: vi.fn(),
  };

  beforeEach(() => {
    Object.values(loaders).forEach((loader) =>
      loader.mockReset().mockResolvedValue(undefined)
    );
    useAppStore.setState({ coreLoadedAt: 0 });
  });

  it('loads the whole month once on mount', async () => {
    // Act
    renderHook(() => useDashboardData('2026-03-07', loaders));
    await flush();

    // Assert
    expect(loaders.loadExpensesByDateRange).toHaveBeenCalledTimes(1);
    expect(loaders.loadExpensesByDateRange).toHaveBeenCalledWith(
      '2026-03-01',
      '2026-03-31'
    );
  });

  it('reloads the month after a global sync replaced the stores', async () => {
    // Arrange
    renderHook(() => useDashboardData('2026-03-07', loaders));
    await flush();
    expect(loaders.loadExpensesByDateRange).toHaveBeenCalledTimes(1);

    // Act: loadFromSupabase finished and wiped expenses, sales and tips
    act(() => {
      useAppStore.setState({ coreLoadedAt: 1_000 });
    });
    await flush();

    // Assert
    expect(loaders.loadExpensesByDateRange).toHaveBeenCalledTimes(2);
    expect(loaders.loadSalesByDateRange).toHaveBeenCalledTimes(2);
    expect(loaders.loadRentalsByDateRange).toHaveBeenCalledTimes(2);
    expect(loaders.loadTipsByDateRange).toHaveBeenCalledTimes(2);
    expect(loaders.loadExpensesByDateRange).toHaveBeenLastCalledWith(
      '2026-03-01',
      '2026-03-31'
    );
  });

  it('does not reload when nothing changed', async () => {
    const { rerender } = renderHook(() =>
      useDashboardData('2026-03-07', loaders)
    );
    await flush();

    rerender();
    await flush();

    expect(loaders.loadExpensesByDateRange).toHaveBeenCalledTimes(1);
  });
});
