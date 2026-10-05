import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_CATALOG,
  LEGACY_SHIFT_DEFINITIONS,
  PAYMENT_METHODS,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import { mapShiftOptions as mapCreateShiftOptions } from './rentalSheetViewModel.helpers';
import { mapShiftOptions as mapEditShiftOptions } from './editRentalSheetViewModel.helpers';

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
      const options = mapCreateShiftOptions(
        LEGACY_SHIFT_CATALOG,
        paymentMethod
      );

      // Assert
      shifts.forEach((shift) => {
        expect(priceTextFor(options, shift)).toBe(
          `$${calculateRentalPrice(
            LEGACY_SHIFT_DEFINITIONS[shift],
            paymentMethod,
            0
          )}`
        );
      });
    }
  );

  it.each(PAYMENT_METHODS)(
    'prices the edit sheet options exactly like the create sheet for %s (B7)',
    (paymentMethod) => {
      // Arrange
      const expected = mapCreateShiftOptions(
        LEGACY_SHIFT_CATALOG,
        paymentMethod
      );

      // Act
      const options = mapEditShiftOptions(LEGACY_SHIFT_CATALOG, paymentMethod);

      // Assert
      expect(options).toEqual(expected);
    }
  );

  it('shows Completo at $6 for efectivo and $5 only for divisa in the edit sheet (B7)', () => {
    // Arrange / Act
    const efectivo = mapEditShiftOptions(LEGACY_SHIFT_CATALOG, 'efectivo');
    const divisa = mapEditShiftOptions(LEGACY_SHIFT_CATALOG, 'divisa');

    // Assert
    expect(priceTextFor(efectivo, 'completo')).toBe('$6');
    expect(priceTextFor(divisa, 'completo')).toBe('$5');
  });

  it('lists a custom shift with its own label and price', () => {
    // Arrange
    const nocturno: RentalShiftDefinition = {
      id: 'uuid-nocturno',
      label: 'Nocturno',
      priceUsd: 5,
      hours: 12,
      divisaDiscountUsd: 1,
    };

    // Act
    const efectivo = mapCreateShiftOptions([nocturno], 'efectivo');
    const divisa = mapCreateShiftOptions([nocturno], 'divisa');

    // Assert
    expect(efectivo).toEqual([
      { value: 'uuid-nocturno', label: 'Nocturno', priceText: '$5' },
    ]);
    expect(priceTextFor(divisa, 'uuid-nocturno')).toBe('$4');
  });

  it('returns no options for an empty catalog', () => {
    // Arrange / Act / Assert
    expect(mapCreateShiftOptions([], 'efectivo')).toEqual([]);
  });
});
