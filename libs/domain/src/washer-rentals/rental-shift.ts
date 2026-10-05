export const RENTAL_SHIFT = {
  medio: 'medio',
  completo: 'completo',
  doble: 'doble',
} as const;

export type LegacyRentalShift =
  (typeof RENTAL_SHIFT)[keyof typeof RENTAL_SHIFT];

export type RentalShift = string;

export const DEFAULT_RENTAL_SHIFT: LegacyRentalShift = RENTAL_SHIFT.completo;

export const LEGACY_RENTAL_SHIFTS: ReadonlyArray<LegacyRentalShift> =
  Object.values(RENTAL_SHIFT);

export function isLegacyRentalShift(value: string): value is LegacyRentalShift {
  return LEGACY_RENTAL_SHIFTS.some((shift) => shift === value);
}

export interface RentalShiftDefinition {
  id: string;
  label: string;
  priceUsd: number;
  hours: number;
  divisaDiscountUsd: number;
}

export interface RentalShiftCatalogEntry extends RentalShiftDefinition {
  code: string;
}

export type RentalShiftDraft = Omit<RentalShiftDefinition, 'id'>;

export type RentalShiftUpdate = Partial<RentalShiftDraft>;

export const LEGACY_SHIFT_DEFINITIONS: Readonly<
  Record<LegacyRentalShift, RentalShiftDefinition>
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

export const LEGACY_SHIFT_CATALOG: ReadonlyArray<RentalShiftCatalogEntry> =
  LEGACY_RENTAL_SHIFTS.map((shift) => ({
    ...LEGACY_SHIFT_DEFINITIONS[shift],
    code: shift.toUpperCase(),
  }));
