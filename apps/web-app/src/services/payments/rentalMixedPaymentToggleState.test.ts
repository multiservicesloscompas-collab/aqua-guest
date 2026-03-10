import { describe, expect, it } from 'vitest';
import { buildDualPaymentSplits } from './paymentSplitWritePath';

describe('rental mixed-payment toggle state', () => {
  const baseInput = {
    primaryMethod: 'efectivo' as const,
    secondaryMethod: 'pago_movil' as const,
    amountInput: '30',
    amountInputMode: 'primary' as const,
    totalBs: 100,
    totalUsd: 2,
    exchangeRate: 50,
  };

  it('keeps single-method split while mixed toggle is inactive', () => {
    const splits = buildDualPaymentSplits({
      ...baseInput,
      enableMixedPayment: false,
    });

    expect(splits).toEqual([
      {
        method: 'efectivo',
        amountBs: 100,
        amountUsd: 2,
        exchangeRateUsed: 50,
      },
    ]);
  });

  it('builds dual splits after mixed toggle activation', () => {
    const splits = buildDualPaymentSplits({
      ...baseInput,
      enableMixedPayment: true,
    });

    expect(splits).toEqual([
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
    ]);
  });
});
