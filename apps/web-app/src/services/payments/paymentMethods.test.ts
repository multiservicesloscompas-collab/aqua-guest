import { describe, expect, it } from 'vitest';
import { PaymentMethodLabels } from '@/types';
import {
  PAYMENT_METHODS as DOMAIN_PAYMENT_METHODS,
  type PaymentSplit,
} from '@aqua-guest/domain';
import { PAYMENT_METHODS } from './paymentMethods';
import { getPaymentMethods } from './paymentSplitReadModel';
import { validatePaymentSplits } from './paymentSplitValidation';

describe('PAYMENT_METHODS', () => {
  it('lists every payment method in the display order used by summaries', () => {
    // Arrange / Act
    const methods = [...PAYMENT_METHODS];

    // Assert
    expect(methods).toEqual([
      'efectivo',
      'pago_movil',
      'punto_venta',
      'divisa',
    ]);
  });

  it('is the list owned by the domain, not a second copy', () => {
    // Arrange / Act / Assert
    expect(PAYMENT_METHODS).toBe(DOMAIN_PAYMENT_METHODS);
  });

  it('covers exactly the methods that have a label', () => {
    // Arrange
    const labelled = Object.keys(PaymentMethodLabels).sort();

    // Act
    const listed = [...PAYMENT_METHODS].sort();

    // Assert
    expect(listed).toEqual(labelled);
  });

  it('is what the split read model exposes', () => {
    // Arrange / Act
    const exposed = getPaymentMethods();

    // Assert
    expect(exposed).toEqual(PAYMENT_METHODS);
  });

  it('is the default set of methods accepted by split validation', () => {
    // Arrange
    const splits: PaymentSplit[] = PAYMENT_METHODS.map((method) => ({
      method,
      amountBs: 10,
    }));

    // Act
    const result = validatePaymentSplits({
      splits,
      totalBs: 10 * PAYMENT_METHODS.length,
    });

    // Assert
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('rejects a method outside the list in split validation', () => {
    // Arrange
    const unknownMethod = 'bitcoin' as unknown as PaymentSplit['method'];

    // Act
    const result = validatePaymentSplits({
      splits: [{ method: unknownMethod, amountBs: 10 }],
      totalBs: 10,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Método de pago inválido: bitcoin');
  });
});
