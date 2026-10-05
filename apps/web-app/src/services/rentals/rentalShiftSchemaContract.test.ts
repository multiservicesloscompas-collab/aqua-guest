import { describe, expect, it } from 'vitest';
import type { RentalShiftCatalogEntry } from '@aqua-guest/domain';
import {
  fromRentalShiftRow,
  toRentalShiftInsertRow,
  toRentalShiftUpdateRow,
  type RentalShiftRow,
} from './rentalShiftSchemaContract';

const ROW: RentalShiftRow = {
  id: 'uuid-nocturno',
  code: 'NOCTURNO',
  label: 'Nocturno',
  price_usd: 5,
  hours: 12,
  divisa_discount_usd: 1,
  is_active: true,
  deleted_at: null,
};

const ENTRY: RentalShiftCatalogEntry = {
  id: 'uuid-nocturno',
  code: 'NOCTURNO',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 1,
};

describe('fromRentalShiftRow', () => {
  it('maps a row to a catalog entry', () => {
    // Arrange / Act
    const entry = fromRentalShiftRow(ROW);

    // Assert
    expect(entry).toEqual(ENTRY);
  });

  it('reads numeric columns that arrive as strings', () => {
    // Arrange
    const row = {
      ...ROW,
      price_usd: '5.50',
      hours: '12',
      divisa_discount_usd: '1',
    } as unknown as RentalShiftRow;

    // Act
    const entry = fromRentalShiftRow(row);

    // Assert
    expect(entry.priceUsd).toBe(5.5);
    expect(entry.hours).toBe(12);
    expect(entry.divisaDiscountUsd).toBe(1);
  });
});

describe('toRentalShiftInsertRow', () => {
  it('maps a draft and its code to insert columns', () => {
    // Arrange
    const draft = {
      label: 'Nocturno',
      priceUsd: 5,
      hours: 12,
      divisaDiscountUsd: 1,
    };

    // Act
    const row = toRentalShiftInsertRow(draft, 'NOCTURNO');

    // Assert
    expect(row).toEqual({
      code: 'NOCTURNO',
      label: 'Nocturno',
      price_usd: 5,
      hours: 12,
      divisa_discount_usd: 1,
    });
  });
});

describe('toRentalShiftUpdateRow', () => {
  it('maps only the fields that changed', () => {
    // Arrange / Act
    const row = toRentalShiftUpdateRow({ priceUsd: 7 });

    // Assert
    expect(row).toEqual({ price_usd: 7 });
  });

  it('never carries the code', () => {
    // Arrange / Act
    const row = toRentalShiftUpdateRow({
      label: 'Nuevo',
      priceUsd: 7,
      hours: 10,
      divisaDiscountUsd: 0,
    });

    // Assert
    expect(row).not.toHaveProperty('code');
    expect(row).toEqual({
      label: 'Nuevo',
      price_usd: 7,
      hours: 10,
      divisa_discount_usd: 0,
    });
  });

  it('keeps a zero discount instead of dropping it', () => {
    // Arrange / Act
    const row = toRentalShiftUpdateRow({ divisaDiscountUsd: 0 });

    // Assert
    expect(row).toEqual({ divisa_discount_usd: 0 });
  });
});
