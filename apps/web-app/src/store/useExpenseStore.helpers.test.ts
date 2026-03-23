import { describe, expect, it, vi } from 'vitest';
import {
  updateExpenseWithSplitCompensationStrict,
  type SupabaseCompensatingLike,
} from './useExpenseStore.helpers';

describe('updateExpenseWithSplitCompensationStrict', () => {
  it('restores previous splits and throws when root update fails', async () => {
    const expenseSplitsSelectEqMock = vi.fn().mockResolvedValue({
      data: [
        {
          expense_id: 'expense-1',
          payment_method: 'efectivo',
          amount_bs: 100,
          amount_usd: 2,
          exchange_rate_used: 50,
        },
      ],
      error: null,
    });
    const expenseSplitsDeleteEqMock = vi
      .fn()
      .mockResolvedValue({ error: null });
    const expenseSplitsInsertMock = vi.fn().mockResolvedValue({ error: null });
    const expensesUpdateEqMock = vi.fn().mockResolvedValue({
      error: new Error('root update failed'),
    });

    const supabase = {
      from: (table: string) => {
        if (table === 'expense_payment_splits') {
          return {
            select: () => ({ eq: expenseSplitsSelectEqMock }),
            delete: () => ({ eq: expenseSplitsDeleteEqMock }),
            insert: expenseSplitsInsertMock,
          };
        }

        if (table === 'expenses') {
          return {
            update: () => ({ eq: expensesUpdateEqMock }),
            insert: vi.fn(),
            delete: () => ({ eq: vi.fn() }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseCompensatingLike;

    await expect(
      updateExpenseWithSplitCompensationStrict(
        supabase,
        'expense-1',
        { payment_method: 'pago_movil' },
        [
          {
            method: 'pago_movil',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ]
      )
    ).rejects.toThrow('root update failed');

    expect(expenseSplitsSelectEqMock).toHaveBeenCalledWith(
      'expense_id',
      'expense-1'
    );
    expect(expenseSplitsInsertMock).toHaveBeenLastCalledWith([
      {
        expense_id: 'expense-1',
        payment_method: 'efectivo',
        amount_bs: 100,
        amount_usd: 2,
        exchange_rate_used: 50,
      },
    ]);
  });

  it('throws high-severity error when rollback fails after update error', async () => {
    const expenseSplitsSelectEqMock = vi.fn().mockResolvedValue({
      data: [
        {
          expense_id: 'expense-1',
          payment_method: 'efectivo',
          amount_bs: 100,
          amount_usd: 2,
          exchange_rate_used: 50,
        },
      ],
      error: null,
    });
    const expenseSplitsDeleteEqMock = vi
      .fn()
      .mockResolvedValue({ error: null });
    const expenseSplitsInsertMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('rollback insert failed') });
    const expensesUpdateEqMock = vi.fn().mockResolvedValue({
      error: new Error('root update failed'),
    });

    const supabase = {
      from: (table: string) => {
        if (table === 'expense_payment_splits') {
          return {
            select: () => ({ eq: expenseSplitsSelectEqMock }),
            delete: () => ({ eq: expenseSplitsDeleteEqMock }),
            insert: expenseSplitsInsertMock,
          };
        }

        if (table === 'expenses') {
          return {
            update: () => ({ eq: expensesUpdateEqMock }),
            insert: vi.fn(),
            delete: () => ({ eq: vi.fn() }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseCompensatingLike;

    await expect(
      updateExpenseWithSplitCompensationStrict(
        supabase,
        'expense-1',
        { payment_method: 'pago_movil' },
        [
          {
            method: 'pago_movil',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ]
      )
    ).rejects.toThrow(
      'Expense update failed after split replacement and rollback failed: rollback insert failed'
    );
  });
});
