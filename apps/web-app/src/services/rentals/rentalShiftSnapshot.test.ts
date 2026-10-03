import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import {
  fromShiftSnapshotColumns,
  toShiftSnapshotColumns,
} from './rentalShiftSnapshot';

const DOBLE_ESPECIAL: RentalShiftDefinition = {
  id: RENTAL_SHIFT.doble,
  label: 'Doble Especial',
  priceUsd: 10,
  hours: 36,
  divisaDiscountUsd: 2,
};

describe('toShiftSnapshotColumns', () => {
  it('maps a definition to the four snapshot columns', () => {
    // Arrange / Act
    const columns = toShiftSnapshotColumns(DOBLE_ESPECIAL);

    // Assert
    expect(columns).toEqual({
      shift_label: 'Doble Especial',
      shift_hours: 36,
      shift_price_usd: 10,
      shift_divisa_discount_usd: 2,
    });
  });
});

describe('fromShiftSnapshotColumns', () => {
  it('rebuilds the definition using the rental shift as id', () => {
    // Arrange
    const columns = toShiftSnapshotColumns(DOBLE_ESPECIAL);

    // Act
    const definition = fromShiftSnapshotColumns(RENTAL_SHIFT.doble, columns);

    // Assert
    expect(definition).toEqual(DOBLE_ESPECIAL);
  });

  it('reads numeric columns that arrive as strings', () => {
    // Arrange
    const columns = {
      shift_label: 'Completo',
      shift_hours: '24',
      shift_price_usd: '6',
      shift_divisa_discount_usd: '1',
    };

    // Act
    const definition = fromShiftSnapshotColumns(RENTAL_SHIFT.completo, columns);

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.completo]);
  });

  it('returns undefined for a legacy rental without snapshot', () => {
    // Arrange
    const columns = {
      shift_label: null,
      shift_hours: null,
      shift_price_usd: null,
      shift_divisa_discount_usd: null,
    };

    // Act / Assert
    expect(
      fromShiftSnapshotColumns(RENTAL_SHIFT.medio, columns)
    ).toBeUndefined();
    expect(fromShiftSnapshotColumns(RENTAL_SHIFT.medio, {})).toBeUndefined();
  });

  it('returns undefined when the snapshot is incomplete', () => {
    // Arrange
    const columns = {
      ...toShiftSnapshotColumns(DOBLE_ESPECIAL),
      shift_hours: null,
    };

    // Act / Assert
    expect(
      fromShiftSnapshotColumns(RENTAL_SHIFT.doble, columns)
    ).toBeUndefined();
  });
});
