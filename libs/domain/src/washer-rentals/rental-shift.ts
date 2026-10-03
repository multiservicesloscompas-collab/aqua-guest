export const RENTAL_SHIFT = {
  medio: 'medio',
  completo: 'completo',
  doble: 'doble',
} as const;

export type RentalShift = (typeof RENTAL_SHIFT)[keyof typeof RENTAL_SHIFT];

export const RENTAL_SHIFTS: ReadonlyArray<RentalShift> =
  Object.values(RENTAL_SHIFT);

export function isRentalShift(value: string): value is RentalShift {
  return RENTAL_SHIFTS.some((shift) => shift === value);
}

export interface RentalShiftDefinition {
  id: string;
  label: string;
  priceUsd: number;
  hours: number;
  divisaDiscountUsd: number;
}

export const LEGACY_SHIFT_DEFINITIONS: Readonly<
  Record<RentalShift, RentalShiftDefinition>
> = {
  [RENTAL_SHIFT.medio]: {
    id: RENTAL_SHIFT.medio,
    label: 'Medio Turno',
    priceUsd: 4,
    hours: 8,
    divisaDiscountUsd: 0,
  },
  [RENTAL_SHIFT.completo]: {
    id: RENTAL_SHIFT.completo,
    label: 'Completo',
    priceUsd: 6,
    hours: 24,
    divisaDiscountUsd: 1,
  },
  [RENTAL_SHIFT.doble]: {
    id: RENTAL_SHIFT.doble,
    label: 'Doble',
    priceUsd: 12,
    hours: 48,
    divisaDiscountUsd: 0,
  },
};
