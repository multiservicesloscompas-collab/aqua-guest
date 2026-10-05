import { describe, expect, it } from 'vitest';
import type { RentalShiftDraft } from '@aqua-guest/domain';
import { SHIFT_VALIDATION_ERROR, validateShiftDraft } from './shiftValidation';

const VALID: RentalShiftDraft = {
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 1,
};

describe('validateShiftDraft', () => {
  it('accepts a valid draft', () => {
    // Arrange / Act / Assert
    expect(validateShiftDraft(VALID)).toEqual([]);
  });

  it('accepts a free shift with no discount', () => {
    // Arrange / Act / Assert
    expect(
      validateShiftDraft({ ...VALID, priceUsd: 0, divisaDiscountUsd: 0 })
    ).toEqual([]);
  });

  it('accepts a discount equal to the price', () => {
    // Arrange / Act / Assert
    expect(
      validateShiftDraft({ ...VALID, priceUsd: 5, divisaDiscountUsd: 5 })
    ).toEqual([]);
  });

  it.each(['', '   '])('rejects the blank label %j', (label) => {
    // Arrange / Act
    const errors = validateShiftDraft({ ...VALID, label });

    // Assert
    expect(errors).toEqual([SHIFT_VALIDATION_ERROR.labelRequired]);
  });

  it('rejects a label with no usable characters for the code', () => {
    // Arrange / Act
    const errors = validateShiftDraft({ ...VALID, label: '!!!' });

    // Assert
    expect(errors).toEqual([SHIFT_VALIDATION_ERROR.labelWithoutCode]);
  });

  it('rejects a negative price', () => {
    // Arrange / Act
    const errors = validateShiftDraft({ ...VALID, priceUsd: -1 });

    // Assert
    expect(errors).toContain(SHIFT_VALIDATION_ERROR.priceInvalid);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the non-finite price %s',
    (priceUsd) => {
      // Arrange / Act
      const errors = validateShiftDraft({ ...VALID, priceUsd });

      // Assert
      expect(errors).toContain(SHIFT_VALIDATION_ERROR.priceInvalid);
    }
  );

  it.each([0, -3, 1.5, Number.NaN])('rejects %s hours', (hours) => {
    // Arrange / Act
    const errors = validateShiftDraft({ ...VALID, hours });

    // Assert
    expect(errors).toEqual([SHIFT_VALIDATION_ERROR.hoursInvalid]);
  });

  it('rejects a negative discount', () => {
    // Arrange / Act
    const errors = validateShiftDraft({ ...VALID, divisaDiscountUsd: -1 });

    // Assert
    expect(errors).toEqual([SHIFT_VALIDATION_ERROR.discountInvalid]);
  });

  it('rejects a discount greater than the price', () => {
    // Arrange / Act
    const errors = validateShiftDraft({
      ...VALID,
      priceUsd: 5,
      divisaDiscountUsd: 6,
    });

    // Assert
    expect(errors).toEqual([SHIFT_VALIDATION_ERROR.discountExceedsPrice]);
  });

  it('reports every problem at once', () => {
    // Arrange / Act
    const errors = validateShiftDraft({
      label: '',
      priceUsd: -1,
      hours: 0,
      divisaDiscountUsd: -2,
    });

    // Assert
    expect(errors).toEqual([
      SHIFT_VALIDATION_ERROR.labelRequired,
      SHIFT_VALIDATION_ERROR.priceInvalid,
      SHIFT_VALIDATION_ERROR.hoursInvalid,
      SHIFT_VALIDATION_ERROR.discountInvalid,
    ]);
  });
});
