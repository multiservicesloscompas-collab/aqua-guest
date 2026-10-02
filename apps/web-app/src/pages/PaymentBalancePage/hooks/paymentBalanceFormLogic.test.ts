import { describe, expect, it } from 'vitest';
import { validatePaymentBalanceForm } from './paymentBalanceFormLogic';
import type { PaymentBalanceFormData } from './usePaymentBalancePageViewModel';

const form = (
  overrides: Partial<PaymentBalanceFormData> = {}
): PaymentBalanceFormData => ({
  operationType: 'equilibrio',
  fromMethod: 'efectivo',
  toMethod: 'pago_movil',
  amountOut: '100',
  amountIn: '',
  notes: '',
  ...overrides,
});

describe('validatePaymentBalanceForm', () => {
  it.each([0, -50, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid exchange rate (%s) instead of producing Infinity (FIN-11)',
    (rate) => {
      // Act
      const result = validatePaymentBalanceForm(form(), rate);

      // Assert
      expect(result.payload).toBeNull();
      expect(result.error).toBe('La tasa de cambio no es válida');
    }
  );

  it('does not cap a transfer by the day total: balances accumulate across days (FIN-11)', () => {
    // Arrange: the form has no knowledge of any balance, only of the amount
    const result = validatePaymentBalanceForm(
      form({ amountOut: '1000000' }),
      50
    );

    // Assert
    expect(result.error).toBeNull();
    expect(result.payload?.amountOutBs).toBe(1_000_000);
    expect(result.payload?.amountInBs).toBe(1_000_000);
  });

  it('keeps the existing validation messages', () => {
    expect(
      validatePaymentBalanceForm(form({ toMethod: 'efectivo' }), 50).error
    ).toBe('Los métodos de pago origen y destino deben ser diferentes');
    expect(validatePaymentBalanceForm(form({ amountOut: '0' }), 50).error).toBe(
      'El monto de salida debe ser un número positivo'
    );
    expect(
      validatePaymentBalanceForm(form({ operationType: 'avance' }), 50).error
    ).toBe('Completa el monto de entrada para registrar el avance');
  });
});
