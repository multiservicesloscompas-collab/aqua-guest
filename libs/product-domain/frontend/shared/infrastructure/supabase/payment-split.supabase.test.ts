import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import {
  fromPaymentSplitRows,
  PAYMENT_SPLIT_READ_SELECT,
  toPaymentSplitInsertRows,
} from './payment-split.supabase';

describe('PAYMENT_SPLIT_READ_SELECT', () => {
  it('includes an aliased payment_kind column', () => {
    expect(PAYMENT_SPLIT_READ_SELECT).toContain('kind:payment_kind');
  });
});

describe('toPaymentSplitInsertRows', () => {
  const paymentSplit: PaymentSplit = {
    method: 'efectivo',
    amountBs: 599,
    amountUsd: 0.7,
    exchangeRateUsed: 850,
  };

  it('does not emit payment_kind by default (Expenses isolation)', () => {
    const rows = toPaymentSplitInsertRows('expense_id', 'expense-1', [
      paymentSplit,
    ]);

    expect(rows[0]).not.toHaveProperty('payment_kind');
  });

  it('emits payment_kind "payment" when emitKind is true and kind is absent', () => {
    const rows = toPaymentSplitInsertRows(
      'sale_id',
      'sale-1',
      [paymentSplit],
      { emitKind: true }
    );

    expect(rows[0].payment_kind).toBe('payment');
  });

  it('emits the explicit "change" kind when emitKind is true', () => {
    const changeSplit: PaymentSplit = {
      method: 'divisa',
      amountBs: -3400,
      amountUsd: -4,
      exchangeRateUsed: 850,
      kind: 'change',
    };

    const rows = toPaymentSplitInsertRows('sale_id', 'sale-1', [changeSplit], {
      emitKind: true,
    });

    expect(rows[0].payment_kind).toBe('change');
    expect(rows[0].amount_bs).toBe(-3400);
  });
});

describe('fromPaymentSplitRows', () => {
  it('maps kind from the aliased column', () => {
    const [split] = fromPaymentSplitRows([
      {
        method: 'divisa',
        amountBs: -3400,
        amountUsd: -4,
        exchangeRateUsed: 850,
        kind: 'change',
      },
    ]);

    expect(split.kind).toBe('change');
  });

  it('falls back to the snake_case payment_kind column', () => {
    const [split] = fromPaymentSplitRows([
      {
        method: 'divisa',
        amountBs: -3400,
        payment_kind: 'change',
      } as never,
    ]);

    expect(split.kind).toBe('change');
  });

  it('defaults kind to "payment" when the column is absent (legacy rows)', () => {
    const [split] = fromPaymentSplitRows([
      { method: 'efectivo', amountBs: 599 },
    ]);

    expect(split.kind).toBe('payment');
  });
});
