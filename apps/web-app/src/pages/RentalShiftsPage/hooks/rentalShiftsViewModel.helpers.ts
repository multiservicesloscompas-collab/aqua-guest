import { match } from 'ts-pattern';
import type {
  RentalShiftCatalogEntry,
  RentalShiftDraft,
  RentalShiftUpdate,
} from '@aqua-guest/domain';
import {
  SHIFT_VALIDATION_ERROR,
  type ShiftValidationError,
} from '@/utils/shiftValidation';

export interface ShiftFormValues {
  label: string;
  priceUsd: string;
  hours: string;
  hasDivisaDiscount: boolean;
  divisaDiscountUsd: string;
}

export const EMPTY_SHIFT_FORM_VALUES: ShiftFormValues = {
  label: '',
  priceUsd: '',
  hours: '',
  hasDivisaDiscount: false,
  divisaDiscountUsd: '',
};

const HOURS_PER_DAY = 24;
const PRICE_DECIMALS = 2;

export function toShiftFormValues(
  shift: RentalShiftCatalogEntry
): ShiftFormValues {
  const hasDivisaDiscount = shift.divisaDiscountUsd > 0;
  return {
    label: shift.label,
    priceUsd: String(shift.priceUsd),
    hours: String(shift.hours),
    hasDivisaDiscount,
    divisaDiscountUsd: hasDivisaDiscount ? String(shift.divisaDiscountUsd) : '',
  };
}

function parseAmount(text: string): number {
  const normalized = text.trim().replace(',', '.');
  return normalized === '' ? Number.NaN : Number(normalized);
}

export function parseShiftForm(values: ShiftFormValues): RentalShiftDraft {
  return {
    label: values.label.trim(),
    priceUsd: parseAmount(values.priceUsd),
    hours: parseAmount(values.hours),
    divisaDiscountUsd: values.hasDivisaDiscount
      ? parseAmount(values.divisaDiscountUsd)
      : 0,
  };
}

export function buildShiftChanges(
  current: RentalShiftCatalogEntry,
  draft: RentalShiftDraft
): RentalShiftUpdate {
  const changes: RentalShiftUpdate = {};
  if (draft.label !== current.label) changes.label = draft.label;
  if (draft.priceUsd !== current.priceUsd) changes.priceUsd = draft.priceUsd;
  if (draft.hours !== current.hours) changes.hours = draft.hours;
  if (draft.divisaDiscountUsd !== current.divisaDiscountUsd) {
    changes.divisaDiscountUsd = draft.divisaDiscountUsd;
  }
  return changes;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatShiftDuration(hours: number): string {
  return hours % HOURS_PER_DAY === 0
    ? pluralize(hours / HOURS_PER_DAY, 'día', 'días')
    : pluralize(hours, 'hora', 'horas');
}

export function formatShiftPrice(priceUsd: number): string {
  return `$${priceUsd.toFixed(PRICE_DECIMALS)}`;
}

export function toShiftValidationMessages(
  errors: ReadonlyArray<ShiftValidationError>
): string[] {
  return errors.map((error) =>
    match(error)
      .with(
        SHIFT_VALIDATION_ERROR.labelRequired,
        () => 'Escribe el nombre del turno'
      )
      .with(
        SHIFT_VALIDATION_ERROR.labelWithoutCode,
        () => 'El nombre debe incluir letras o números'
      )
      .with(
        SHIFT_VALIDATION_ERROR.priceInvalid,
        () => 'El precio debe ser un número mayor o igual a 0'
      )
      .with(
        SHIFT_VALIDATION_ERROR.hoursInvalid,
        () => 'La duración debe ser un número entero de horas mayor a 0'
      )
      .with(
        SHIFT_VALIDATION_ERROR.discountInvalid,
        () => 'El descuento debe ser un número mayor o igual a 0'
      )
      .with(
        SHIFT_VALIDATION_ERROR.discountExceedsPrice,
        () => 'El descuento no puede ser mayor que el precio'
      )
      .exhaustive()
  );
}
