import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  RENTAL_SHIFTS,
  isRentalShift,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import type { WasherRental } from '@/types';
import {
  getShiftMetricLabel,
  resolveEditedRentalShift,
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

describe('isRentalShift', () => {
  it.each(RENTAL_SHIFTS)('accepts %s', (shift) => {
    // Arrange / Act / Assert
    expect(isRentalShift(shift)).toBe(true);
  });

  it.each(['', 'triple', 'COMPLETO'])('rejects %j', (value) => {
    // Arrange / Act / Assert
    expect(isRentalShift(value)).toBe(false);
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

  it.each(RENTAL_SHIFTS)(
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

describe('resolveEditedRentalShift', () => {
  it('keeps the rental terms while the form still has the rental shift', () => {
    // Arrange
    const rental = buildRental({ shiftSnapshot: EDITED_DOBLE });

    // Act
    const definition = resolveEditedRentalShift(rental, RENTAL_SHIFT.doble);

    // Assert
    expect(definition).toEqual(EDITED_DOBLE);
  });

  it('uses the current definition once the user picks another shift', () => {
    // Arrange
    const rental = buildRental({ shiftSnapshot: EDITED_DOBLE });

    // Act
    const definition = resolveEditedRentalShift(rental, RENTAL_SHIFT.medio);

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.medio]);
  });

  it('uses the current definition when there is no rental yet', () => {
    // Arrange / Act
    const definition = resolveEditedRentalShift(null, RENTAL_SHIFT.completo);

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.completo]);
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
