import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExpenseStore } from './useExpenseStore';

const expensesInsertSingleMock = vi.fn();
const expensesInsertSelectMock = vi.fn(() => ({
  single: expensesInsertSingleMock,
}));
const expensesInsertMock = vi.fn(() => ({
  select: expensesInsertSelectMock,
}));
const expensesDeleteEqMock = vi.fn();
const expensesDeleteMock = vi.fn(() => ({ eq: expensesDeleteEqMock }));
const expensesUpdateEqMock = vi.fn();
const expensesUpdateMock = vi.fn(() => ({ eq: expensesUpdateEqMock }));

const expenseSplitsDeleteEqMock = vi.fn();
const expenseSplitsDeleteMock = vi.fn(() => ({
  eq: expenseSplitsDeleteEqMock,
}));
const expenseSplitsSelectEqMock = vi.fn();
const expenseSplitsSelectMock = vi.fn(() => ({
  eq: expenseSplitsSelectEqMock,
}));

const expenseSplitsInsertMock = vi.fn();

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
        insert: expensesInsertMock,
        delete: expensesDeleteMock,
        update: expensesUpdateMock,
      };
    }

    if (table === 'expense_payment_splits') {
      return {
        delete: expenseSplitsDeleteMock,
        insert: expenseSplitsInsertMock,
        select: expenseSplitsSelectMock,
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

describe('useExpenseStore mixed split strict persistence', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true },
    });

    expensesInsertSingleMock.mockResolvedValue({
      data: {
        id: 'expense-1',
        date: '2026-03-17',
        description: 'Compra insumos',
        amount: 100,
        category: 'insumos',
        payment_method: 'pago_movil',
        notes: null,
        created_at: '2026-03-17T12:00:00.000Z',
      },
      error: null,
    });
    expenseSplitsInsertMock.mockResolvedValue({ error: null });
    expensesDeleteEqMock.mockResolvedValue({ error: null });
    expensesUpdateEqMock.mockResolvedValue({ error: null });
    expenseSplitsDeleteEqMock.mockResolvedValue({ error: null });
    expenseSplitsSelectEqMock.mockResolvedValue({ data: [], error: null });

    expensesInsertMock.mockClear();
    expensesInsertSelectMock.mockClear();
    expensesInsertSingleMock.mockClear();
    expenseSplitsInsertMock.mockClear();
    expensesDeleteMock.mockClear();
    expensesDeleteEqMock.mockClear();
    expensesUpdateMock.mockClear();
    expensesUpdateEqMock.mockClear();
    expenseSplitsDeleteMock.mockClear();
    expenseSplitsDeleteEqMock.mockClear();
    expenseSplitsSelectMock.mockClear();
    expenseSplitsSelectEqMock.mockClear();

    useExpenseStore.setState({ expenses: [] });
  });

  it('creates mixed expense online and persists split rows', async () => {
    await useExpenseStore.getState().addExpense({
      date: '2026-03-17',
      description: 'Compra insumos',
      amount: 100,
      category: 'insumos',
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
        },
        {
          method: 'pago_movil',
          amountBs: 70,
          amountUsd: 1.4,
          exchangeRateUsed: 50,
        },
      ],
      notes: undefined,
    });

    expect(expenseSplitsInsertMock).toHaveBeenCalledWith([
      {
        expense_id: 'expense-1',
        payment_method: 'efectivo',
        amount_bs: 30,
        amount_usd: 0.6,
        exchange_rate_used: 50,
      },
      {
        expense_id: 'expense-1',
        payment_method: 'pago_movil',
        amount_bs: 70,
        amount_usd: 1.4,
        exchange_rate_used: 50,
      },
    ]);

    expect(expensesDeleteMock).not.toHaveBeenCalled();
    expect(useExpenseStore.getState().expenses).toHaveLength(1);
  });

  it('rolls back root expense and throws when split insert fails', async () => {
    const splitError = new Error('new row violates row-level security policy');
    expenseSplitsInsertMock.mockResolvedValueOnce({ error: splitError });

    await expect(
      useExpenseStore.getState().addExpense({
        date: '2026-03-17',
        description: 'Compra insumos',
        amount: 100,
        category: 'insumos',
        paymentMethod: 'pago_movil',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 30,
            amountUsd: 0.6,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 70,
            amountUsd: 1.4,
            exchangeRateUsed: 50,
          },
        ],
        notes: undefined,
      })
    ).rejects.toThrow('new row violates row-level security policy');

    expect(expensesDeleteEqMock).toHaveBeenCalledWith('id', 'expense-1');
    expect(useExpenseStore.getState().expenses).toHaveLength(0);
  });

  it('throws and does not update local state when split replacement fails on update', async () => {
    useExpenseStore.setState({
      expenses: [
        {
          id: 'expense-1',
          date: '2026-03-17',
          description: 'Compra insumos',
          amount: 100,
          category: 'insumos',
          paymentMethod: 'efectivo',
          notes: undefined,
          createdAt: '2026-03-17T12:00:00.000Z',
        },
      ],
    });

    const splitError = new Error('split insert failed on update');
    expenseSplitsInsertMock.mockResolvedValueOnce({ error: splitError });

    await expect(
      useExpenseStore.getState().updateExpense('expense-1', {
        paymentMethod: 'pago_movil',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 20,
            amountUsd: 0.4,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 80,
            amountUsd: 1.6,
            exchangeRateUsed: 50,
          },
        ],
      })
    ).rejects.toThrow('split insert failed on update');

    const persistedExpense = useExpenseStore.getState().expenses[0];
    expect(persistedExpense.paymentMethod).toBe('efectivo');
    expect(expenseSplitsDeleteEqMock).toHaveBeenCalledWith(
      'expense_id',
      'expense-1'
    );
  });
});
