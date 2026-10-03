import { describe, expect, it } from 'vitest';
import type { PaymentMethod } from '@/types';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import { mapShiftOptions as mapCreateShiftOptions } from './rentalSheetViewModel.helpers';
import { mapShiftOptions as mapEditShiftOptions } from './editRentalSheetViewModel.helpers';

const PAYMENT_METHODS: PaymentMethod[] = [
  'pago_movil',
  'efectivo',
  'punto_venta',
  'divisa',
];

function priceTextFor(
  options: ReturnType<typeof mapCreateShiftOptions>,
  shift: string
): string | undefined {
  return options.find((option) => option.value === shift)?.priceText;
}

describe('mapShiftOptions', () => {
  it.each(PAYMENT_METHODS)(
    'prices the create sheet options like calculateRentalPrice for %s',
    (paymentMethod) => {
      // Arrange
      const shifts = ['medio', 'completo', 'doble'] as const;

      // Act
      const options = mapCreateShiftOptions(paymentMethod);

      // Assert
      shifts.forEach((shift) => {
        expect(priceTextFor(options, shift)).toBe(
          `$${calculateRentalPrice(shift, paymentMethod, 0)}`
        );
      });
    }
  );

  it.each(PAYMENT_METHODS)(
    'prices the edit sheet options exactly like the create sheet for %s (B7)',
    (paymentMethod) => {
      // Arrange
      const expected = mapCreateShiftOptions(paymentMethod);

      // Act
      const options = mapEditShiftOptions(paymentMethod);

      // Assert
      expect(options).toEqual(expected);
    }
  );

  it('shows Completo at $6 for efectivo and $5 only for divisa in the edit sheet (B7)', () => {
    // Arrange / Act
    const efectivo = mapEditShiftOptions('efectivo');
    const divisa = mapEditShiftOptions('divisa');

    // Assert
    expect(priceTextFor(efectivo, 'completo')).toBe('$6');
    expect(priceTextFor(divisa, 'completo')).toBe('$5');
  });
});
