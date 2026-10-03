import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  LEGACY_RENTAL_SHIFTS,
  isLegacyRentalShift,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import type { WasherRental } from '@/types';
import {
  getRentalShiftMetricLabel,
  getShiftMetricLabel,
  resolveRentalShift,
} from './rentalShift';

type ResolvableRental = Pick<
  WasherRental,
  'shift' | 'shiftSnapshot' | 'totalUsd' | 'deliveryFee'
>;

const EDITED_DOBLE: RentalShiftDefinition = {
  id: RENTAL_SHIFT.doble,
  label: 'Doble Especial',
  priceUsd: 10,
  hours: 36,
  divisaDiscountUsd: 2,
};

function buildRental(
  overrides: Partial<ResolvableRental> = {}
): ResolvableRental {
  return {
    shift: RENTAL_SHIFT.doble,
    shiftSnapshot: undefined,
    totalUsd: 12,
    deliveryFee: 0,
    ...overrides,
  };
}

describe('isLegacyRentalShift', () => {
  it.each(LEGACY_RENTAL_SHIFTS)('accepts %s', (shift) => {
    // Arrange / Act / Assert
    expect(isLegacyRentalShift(shift)).toBe(true);
  });

  it.each(['', 'triple', 'COMPLETO'])('rejects %j', (value) => {
    // Arrange / Act / Assert
    expect(isLegacyRentalShift(value)).toBe(false);
  });
});

describe('resolveRentalShift', () => {
  it('returns the snapshot stored with the rental when there is one', () => {
    // Arrange
    const rental = buildRental({ shiftSnapshot: EDITED_DOBLE });

    // Act
    const definition = resolveRentalShift(rental);

    // Assert
    expect(definition).toEqual(EDITED_DOBLE);
  });

  it.each(LEGACY_RENTAL_SHIFTS)(
    'falls back to the frozen legacy definition of %s when there is no snapshot',
    (shift) => {
      // Arrange
      const rental = buildRental({ shift });

      // Act
      const definition = resolveRentalShift(rental);

      // Assert
      expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[shift]);
    }
  );

  it('prefers the snapshot over the legacy definition of the same shift', () => {
    // Arrange
    const rental = buildRental({
      shift: RENTAL_SHIFT.doble,
      shiftSnapshot: EDITED_DOBLE,
    });

    // Act
    const definition = resolveRentalShift(rental);

    // Assert
    expect(definition.priceUsd).not.toBe(
      LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.doble].priceUsd
    );
  });

  it('derives an honest definition from the stored amounts for an unknown shift', () => {
    // Arrange
    const rental = buildRental({
      shift: 'triple' as WasherRental['shift'],
      totalUsd: 9,
      deliveryFee: 2,
    });

    // Act
    const definition = resolveRentalShift(rental);

    // Assert
    expect(definition).toEqual({
      id: 'triple',
      label: 'triple',
      priceUsd: 7,
      hours: 0,
      divisaDiscountUsd: 0,
    });
  });

  it('never derives a negative price for an unknown shift', () => {
    // Arrange
    const rental = buildRental({
      shift: 'triple' as WasherRental['shift'],
      totalUsd: 1,
      deliveryFee: 5,
    });

    // Act / Assert
    expect(resolveRentalShift(rental).priceUsd).toBe(0);
  });
});

describe('getShiftMetricLabel', () => {
  it.each([
    [RENTAL_SHIFT.medio, 'Medio Turno'],
    [RENTAL_SHIFT.completo, 'Turno Completo'],
    [RENTAL_SHIFT.doble, 'Turno Doble'],
  ])('labels %s as %s', (shift, label) => {
    // Arrange / Act / Assert
    expect(getShiftMetricLabel(shift)).toBe(label);
  });

  it('returns the raw key for a shift it does not know', () => {
    // Arrange / Act / Assert
    expect(getShiftMetricLabel('triple')).toBe('triple');
  });
});

describe('getRentalShiftMetricLabel', () => {
  it.each([
    [RENTAL_SHIFT.medio, 'Medio Turno'],
    [RENTAL_SHIFT.completo, 'Turno Completo'],
    [RENTAL_SHIFT.doble, 'Turno Doble'],
  ])(
    'keeps the historical metric label of %s without snapshot',
    (shift, label) => {
      // Arrange
      const rental = buildRental({ shift, shiftSnapshot: undefined });

      // Act / Assert
      expect(getRentalShiftMetricLabel(rental)).toBe(label);
    }
  );

  it('uses the snapshot label for a custom shift', () => {
    // Arrange
    const rental = buildRental({
      shift: 'uuid-nocturno',
      shiftSnapshot: {
        id: 'uuid-nocturno',
        label: 'Nocturno',
        priceUsd: 5,
        hours: 12,
        divisaDiscountUsd: 0,
      },
    });

    // Act / Assert
    expect(getRentalShiftMetricLabel(rental)).toBe('Nocturno');
  });

  it('never shows an opaque id when a custom shift has no snapshot', () => {
    // Arrange
    const rental = buildRental({
      shift: 'uuid-nocturno',
      shiftSnapshot: undefined,
    });

    // Act / Assert
    expect(getRentalShiftMetricLabel(rental)).toBe('uuid-nocturno');
  });
});
