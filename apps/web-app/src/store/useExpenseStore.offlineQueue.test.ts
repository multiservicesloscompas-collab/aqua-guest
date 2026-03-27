import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExpenseStore } from './useExpenseStore';
import { useSyncStore } from './useSyncStore';

const expenseInsertMock = vi.fn();

vi.mock('@/services/ExpensesDataService', () => ({
  expensesDataService: {
    invalidateCache: vi.fn(),
    loadExpensesByDate: vi.fn(),
    loadExpensesByDates: vi.fn(),
    loadExpensesByDateRange: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'expenses') {
      return {
        insert: expenseInsertMock,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const client = { from };
  return {
    default: client,
    supabase: client,
  };
});

describe('useExpenseStore offline queueing', () => {
  beforeEach(() => {
    expenseInsertMock.mockReset();
    useSyncStore.getState().clearQueue();
    useExpenseStore.setState({ expenses: [] });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues expense create and does not call supabase when offline', async () => {
    await useExpenseStore.getState().addExpense({
      date: '2026-03-09',
      description: 'Compra cloro',
      amount: 250,
      category: 'insumos',
      paymentMethod: 'pago_movil',
      notes: 'Proveedor local',
    });

    expect(expenseInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('expenses');
    expect(queue[0].type).toBe('INSERT');
    expect(useExpenseStore.getState().expenses).toHaveLength(1);
  });
});
