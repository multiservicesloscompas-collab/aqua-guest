import { describe, expect, it } from 'vitest';
import type { RentalShiftCatalogEntry } from '@aqua-guest/domain';
import { SHIFT_VALIDATION_ERROR } from '@/utils/shiftValidation';
import {
  EMPTY_SHIFT_FORM_VALUES,
  buildShiftChanges,
  formatShiftDuration,
  formatShiftPrice,
  parseShiftForm,
  toShiftFormValues,
  toShiftValidationMessages,
} from './rentalShiftsViewModel.helpers';

const NOCTURNO: RentalShiftCatalogEntry = {
  id: 'uuid-nocturno',
  code: 'NOCTURNO',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 1,
};

describe('toShiftFormValues', () => {
  it('turns a shift with a divisa discount into form text', () => {
    // Arrange / Act
    const values = toShiftFormValues(NOCTURNO);

    // Assert
    expect(values).toEqual({
      label: 'Nocturno',
      priceUsd: '5',
      hours: '12',
      hasDivisaDiscount: true,
      divisaDiscountUsd: '1',
    });
  });

  it('leaves the discount switched off when the shift has none', () => {
    // Arrange / Act
    const values = toShiftFormValues({ ...NOCTURNO, divisaDiscountUsd: 0 });

    // Assert
    expect(values.hasDivisaDiscount).toBe(false);
    expect(values.divisaDiscountUsd).toBe('');
  });
});

describe('parseShiftForm', () => {
  it('parses text fields into a draft', () => {
    // Arrange
    const values = {
      label: '  Nocturno  ',
      priceUsd: '5.50',
      hours: '12',
      hasDivisaDiscount: true,
      divisaDiscountUsd: '1',
    };

    // Act
    const draft = parseShiftForm(values);

    // Assert
    expect(draft).toEqual({
      label: 'Nocturno',
      priceUsd: 5.5,
      hours: 12,
      divisaDiscountUsd: 1,
    });
  });

  it('ignores the discount text while the switch is off', () => {
    // Arrange
    const values = {
      ...toShiftFormValues(NOCTURNO),
      hasDivisaDiscount: false,
      divisaDiscountUsd: '99',
    };

    // Act
    const draft = parseShiftForm(values);

    // Assert
    expect(draft.divisaDiscountUsd).toBe(0);
  });

  it('accepts a decimal comma typed by the user', () => {
    // Arrange
    const values = { ...toShiftFormValues(NOCTURNO), priceUsd: '5,5' };

    // Act / Assert
    expect(parseShiftForm(values).priceUsd).toBe(5.5);
  });

  it('turns blank numbers into NaN so validation can reject them', () => {
    // Arrange / Act
    const draft = parseShiftForm({
      ...EMPTY_SHIFT_FORM_VALUES,
      label: 'Nocturno',
      hasDivisaDiscount: true,
    });

    // Assert
    expect(Number.isNaN(draft.priceUsd)).toBe(true);
    expect(Number.isNaN(draft.hours)).toBe(true);
    expect(Number.isNaN(draft.divisaDiscountUsd)).toBe(true);
  });
});

describe('buildShiftChanges', () => {
  it('returns only the fields that changed', () => {
    // Arrange
    const draft = {
      label: 'Nocturno',
      priceUsd: 7,
      hours: 12,
      divisaDiscountUsd: 1,
    };

    // Act
    const changes = buildShiftChanges(NOCTURNO, draft);

    // Assert
    expect(changes).toEqual({ priceUsd: 7 });
  });

  it('returns an empty object when nothing changed', () => {
    // Arrange
    const draft = {
      label: NOCTURNO.label,
      priceUsd: NOCTURNO.priceUsd,
      hours: NOCTURNO.hours,
      divisaDiscountUsd: NOCTURNO.divisaDiscountUsd,
    };

    // Act / Assert
    expect(buildShiftChanges(NOCTURNO, draft)).toEqual({});
  });

  it('keeps a discount reset to zero', () => {
    // Arrange
    const draft = {
      label: NOCTURNO.label,
      priceUsd: NOCTURNO.priceUsd,
      hours: NOCTURNO.hours,
      divisaDiscountUsd: 0,
    };

    // Act / Assert
    expect(buildShiftChanges(NOCTURNO, draft)).toEqual({
      divisaDiscountUsd: 0,
    });
  });
});

describe('formatShiftDuration', () => {
  it.each([
    [1, '1 hora'],
    [8, '8 horas'],
    [24, '1 día'],
    [48, '2 días'],
    [36, '36 horas'],
  ])('formats %s hours as %s', (hours, expected) => {
    // Arrange / Act / Assert
    expect(formatShiftDuration(hours)).toBe(expected);
  });
});

describe('formatShiftPrice', () => {
  it.each([
    [6, '$6.00'],
    [5.5, '$5.50'],
    [0, '$0.00'],
  ])('formats %s as %s', (price, expected) => {
    // Arrange / Act / Assert
    expect(formatShiftPrice(price)).toBe(expected);
  });
});

describe('toShiftValidationMessages', () => {
  it('maps every validation error to a distinct Spanish message', () => {
    // Arrange
    const errors = Object.values(SHIFT_VALIDATION_ERROR);

    // Act
    const messages = toShiftValidationMessages(errors);

    // Assert
    expect(new Set(messages).size).toBe(errors.length);
    messages.forEach((message) => expect(message).not.toBe(''));
  });
});
