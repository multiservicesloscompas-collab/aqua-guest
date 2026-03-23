import { describe, expect, it } from 'vitest';

import { mergeExpensesWithTipPayouts } from './expensesWithTipPayouts';

describe('mergeExpensesWithTipPayouts', () => {
  it('adds tip payouts as derived read-only expenses for selected paid date', () => {
    const result = mergeExpensesWithTipPayouts({
      date: '2026-03-08',
      expenses: [
        {
          id: 'expense-1',
          date: '2026-03-08',
          description: 'Operativo diario',
          amount: 10,
          category: 'operativo',
          paymentMethod: 'efectivo',
          createdAt: '2026-03-08T08:00:00.000Z',
        },
      ],
      tipPayouts: [
        {
          id: 'tip-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-08T11:00:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 15,
          originType: 'sale',
          originId: 'sale-1',
        },
        {
          id: 'tip-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-08T11:01:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 15,
          originType: 'rental',
          originId: 'rental-1',
        },
        {
          id: 'tip-2',
          tipDate: '2026-03-08',
          paidAt: '2026-03-08T12:00:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 7,
          originType: 'rental',
          originId: 'rental-2',
        },
      ],
    });

    expect(result).toHaveLength(3);

    const derived = result.filter((expense) =>
      expense.id.startsWith('tip-payout:')
    );
    expect(derived).toHaveLength(2);

    expect(
      derived.map((expense) => expense.amount).sort((a, b) => a - b)
    ).toEqual([7, 15]);
    expect(derived.map((expense) => expense.paymentMethod).sort()).toEqual([
      'efectivo',
      'pago_movil',
    ]);
    expect(derived.map((expense) => expense.description)).toEqual([
      'Pago de Propina',
      'Pago de Propina',
    ]);
    expect(derived.map((expense) => expense.date)).toEqual([
      '2026-03-08',
      '2026-03-08',
    ]);
  });

  it('normalizes paidAt using Venezuela timezone to avoid day mismatch', () => {
    const result = mergeExpensesWithTipPayouts({
      date: '2026-03-13',
      expenses: [],
      tipPayouts: [
        {
          id: 'tip-caracas-1',
          tipDate: '2026-03-13',
          paidAt: '2026-03-14T02:30:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 300,
          originType: 'sale',
          originId: 'sale-3',
        },
        {
          id: 'tip-caracas-2',
          tipDate: '2026-03-13',
          paidAt: '2026-03-13T18:30:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 200,
          originType: 'sale',
          originId: 'sale-2',
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(
      result.map((expense) => expense.amount).sort((a, b) => a - b)
    ).toEqual([200, 300]);
    expect(result.every((expense) => expense.date === '2026-03-13')).toBe(true);
  });
});
