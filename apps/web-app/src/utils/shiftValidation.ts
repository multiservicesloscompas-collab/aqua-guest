import type { RentalShiftDraft } from '@aqua-guest/domain';
import { toShiftCode } from './shiftCode';

export const SHIFT_VALIDATION_ERROR = {
  labelRequired: 'label_required',
  labelWithoutCode: 'label_without_code',
  priceInvalid: 'price_invalid',
  hoursInvalid: 'hours_invalid',
  discountInvalid: 'discount_invalid',
  discountExceedsPrice: 'discount_exceeds_price',
} as const;

export type ShiftValidationError =
  (typeof SHIFT_VALIDATION_ERROR)[keyof typeof SHIFT_VALIDATION_ERROR];

function isNonNegativeAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validateLabel(label: string): ShiftValidationError[] {
  if (label.trim() === '') return [SHIFT_VALIDATION_ERROR.labelRequired];
  return toShiftCode(label, []) === undefined
    ? [SHIFT_VALIDATION_ERROR.labelWithoutCode]
    : [];
}

function validateDiscount(draft: RentalShiftDraft): ShiftValidationError[] {
  if (!isNonNegativeAmount(draft.divisaDiscountUsd)) {
    return [SHIFT_VALIDATION_ERROR.discountInvalid];
  }
  return isNonNegativeAmount(draft.priceUsd) &&
    draft.divisaDiscountUsd > draft.priceUsd
    ? [SHIFT_VALIDATION_ERROR.discountExceedsPrice]
    : [];
}

export function validateShiftDraft(
  draft: RentalShiftDraft
): ShiftValidationError[] {
  return [
    ...validateLabel(draft.label),
    ...(isNonNegativeAmount(draft.priceUsd)
      ? []
      : [SHIFT_VALIDATION_ERROR.priceInvalid]),
    ...(Number.isInteger(draft.hours) && draft.hours > 0
      ? []
      : [SHIFT_VALIDATION_ERROR.hoursInvalid]),
    ...validateDiscount(draft),
  ];
}
