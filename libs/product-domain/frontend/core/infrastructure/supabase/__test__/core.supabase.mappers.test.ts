import { describe, expect, it } from 'vitest';

import {
  toExpense,
  toExpenseCreatePayload,
  toPaymentBalanceTransaction,
  toPaymentBalanceUpdatePayload,
  toTip,
} from '../core.supabase.mappers';

describe('core supabase mappers', () => {
  it('maps expense rows into canonical expenses with payment splits', () => {
    const expense = toExpense({
      id: 'expense-1',
      date: '2026-03-13',
      description: 'Detergente',
      amount: '50',
      category: 'insumos',
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: '20',
          amountUsd: null,
          exchangeRateUsed: null,
        },
        {
          method: 'divisa',
          amountBs: '30',
          amountUsd: '0.6',
          exchangeRateUsed: '50',
        },
      ],
      notes: 'caja 1',
      createdAt: '2026-03-13T10:00:00.000Z',
    });

    expect(expense).toEqual({
      id: 'expense-1',
      date: '2026-03-13',
      description: 'Detergente',
      amount: 50,
      category: 'insumos',
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 20,
          kind: 'payment',
        },
        {
          method: 'divisa',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
          kind: 'payment',
        },
      ],
      notes: 'caja 1',
      createdAt: '2026-03-13T10:00:00.000Z',
    });
  });

  it('maps payment balance rows and update payloads with app-compatible fallbacks', () => {
    const transaction = toPaymentBalanceTransaction({
      id: 'tx-1',
      date: '2026-03-13',
      fromMethod: 'efectivo',
      toMethod: 'pago_movil',
      amount: '100',
      amountOutBs: '100',
      amountInBs: '98',
      differenceBs: null,
      createdAt: '2026-03-13T08:00:00.000Z',
      updatedAt: '2026-03-13T08:30:00.000Z',
    });

    const payload = toPaymentBalanceUpdatePayload({
      amountOutUsd: 2,
      notes: 'ajuste',
    });

    expect(transaction).toMatchObject({
      id: 'tx-1',
      operationType: 'equilibrio',
      amount: 100,
      amountBs: 100,
      amountOutBs: 100,
      amountInBs: 98,
      differenceBs: -2,
    });
    expect(payload).toMatchObject({
      amount_out_usd: 2,
      notes: 'ajuste',
    });
    expect(payload.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('maps tip rows and excludes payment splits from expense payloads', () => {
    const tip = toTip({
      id: 'tip-1',
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: '15',
      amountUsd: '0.3',
      exchangeRateUsed: '50',
      capturePaymentMethod: 'pago_movil',
      status: 'pending',
      paidPaymentMethod: null,
      paidAt: null,
      notes: 'mesa 3',
      createdAt: '2026-03-13T10:00:00.000Z',
      updatedAt: '2026-03-13T10:00:00.000Z',
    });

    const payload = toExpenseCreatePayload({
      date: '2026-03-13',
      description: 'Cafe',
      amount: 20,
      category: 'otros',
      paymentMethod: 'efectivo',
      paymentSplits: [{ method: 'efectivo', amountBs: 20 }],
      notes: 'interno',
    });

    expect(tip).toMatchObject({
      id: 'tip-1',
      amountBs: 15,
      amountUsd: 0.3,
      exchangeRateUsed: 50,
      notes: 'mesa 3',
    });
    expect(payload).toEqual({
      date: '2026-03-13',
      description: 'Cafe',
      amount: 20,
      category: 'otros',
      payment_method: 'efectivo',
      notes: 'interno',
    });
  });
});
