import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RENTAL_SHIFT,
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import {
  findShiftDefinition,
  listSelectableShifts,
  resolveEditedRentalShift,
  resolveShiftDefinitionOrDefault,
} from './shiftCatalog';

const NOCTURNO: RentalShiftDefinition = {
  id: 'uuid-nocturno',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 0,
};

const COMPLETO_REPRICED: RentalShiftDefinition = {
  ...LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.completo],
  priceUsd: 8,
};

describe('findShiftDefinition', () => {
  it('finds a shift in the catalog by id', () => {
    // Arrange / Act
    const definition = findShiftDefinition([NOCTURNO], NOCTURNO.id);

    // Assert
    expect(definition).toEqual(NOCTURNO);
  });

  it('prefers the catalog over the frozen legacy definition', () => {
    // Arrange / Act
    const definition = findShiftDefinition(
      [COMPLETO_REPRICED],
      RENTAL_SHIFT.completo
    );

    // Assert
    expect(definition?.priceUsd).toBe(8);
  });

  it('falls back to the legacy definition when the catalog is empty', () => {
    // Arrange / Act
    const definition = findShiftDefinition([], RENTAL_SHIFT.medio);

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.medio]);
  });

  it('returns undefined for a shift that is neither in the catalog nor legacy', () => {
    // Arrange / Act / Assert
    expect(findShiftDefinition([NOCTURNO], 'uuid-unknown')).toBeUndefined();
  });
});

describe('resolveShiftDefinitionOrDefault', () => {
  it('returns the definition when the shift is known', () => {
    // Arrange / Act / Assert
    expect(resolveShiftDefinitionOrDefault([NOCTURNO], NOCTURNO.id)).toEqual(
      NOCTURNO
    );
  });

  it('returns the default shift definition for an unknown shift', () => {
    // Arrange / Act
    const definition = resolveShiftDefinitionOrDefault([], 'uuid-unknown');

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[DEFAULT_RENTAL_SHIFT]);
  });
});

describe('listSelectableShifts', () => {
  const baseRental = {
    shift: NOCTURNO.id,
    shiftSnapshot: NOCTURNO,
    totalUsd: 5,
    deliveryFee: 0,
  };

  it('returns the catalog when there is no rental', () => {
    // Arrange / Act
    const shifts = listSelectableShifts([NOCTURNO], null);

    // Assert
    expect(shifts).toEqual([NOCTURNO]);
  });

  it('keeps the shift of a rental whose shift left the catalog', () => {
    // Arrange
    const catalog = [LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.medio]];

    // Act
    const shifts = listSelectableShifts(catalog, baseRental);

    // Assert
    expect(shifts.map((shift) => shift.id)).toEqual([
      RENTAL_SHIFT.medio,
      NOCTURNO.id,
    ]);
  });

  it('shows the rental shift with the terms stored in the rental', () => {
    // Arrange
    const repriced = { ...NOCTURNO, priceUsd: 9 };

    // Act
    const shifts = listSelectableShifts([repriced], baseRental);

    // Assert
    expect(shifts).toEqual([NOCTURNO]);
  });

  it('does not duplicate a shift that is still in the catalog and unchanged', () => {
    // Arrange / Act
    const shifts = listSelectableShifts([NOCTURNO], baseRental);

    // Assert
    expect(shifts).toHaveLength(1);
  });
});

describe('resolveEditedRentalShift', () => {
  const rental = {
    shift: RENTAL_SHIFT.doble,
    shiftSnapshot: {
      ...LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.doble],
      priceUsd: 10,
    },
    totalUsd: 10,
    deliveryFee: 0,
  };

  it('keeps the rental terms while the form still has the rental shift', () => {
    // Arrange / Act
    const definition = resolveEditedRentalShift(rental, RENTAL_SHIFT.doble, []);

    // Assert
    expect(definition.priceUsd).toBe(10);
  });

  it('uses the catalog definition once the user picks another shift', () => {
    // Arrange / Act
    const definition = resolveEditedRentalShift(rental, NOCTURNO.id, [
      NOCTURNO,
    ]);

    // Assert
    expect(definition).toEqual(NOCTURNO);
  });

  it('uses the catalog definition when there is no rental yet', () => {
    // Arrange / Act
    const definition = resolveEditedRentalShift(null, NOCTURNO.id, [NOCTURNO]);

    // Assert
    expect(definition).toEqual(NOCTURNO);
  });

  it('falls back to the default shift when the picked shift is unknown', () => {
    // Arrange / Act
    const definition = resolveEditedRentalShift(null, 'uuid-unknown', []);

    // Assert
    expect(definition).toEqual(LEGACY_SHIFT_DEFINITIONS[DEFAULT_RENTAL_SHIFT]);
  });
});
