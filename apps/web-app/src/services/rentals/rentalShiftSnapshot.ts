import type { RentalShiftDefinition } from '@aqua-guest/domain';

export interface ShiftSnapshotColumns {
  shift_label: string;
  shift_hours: number;
  shift_price_usd: number;
  shift_divisa_discount_rule_usd: number;
}

export type ShiftSnapshotColumnsRow = {
  [Key in keyof ShiftSnapshotColumns]?:
    | ShiftSnapshotColumns[Key]
    | string
    | null;
};

export function toShiftSnapshotColumns(
  definition: RentalShiftDefinition
): ShiftSnapshotColumns {
  return {
    shift_label: definition.label,
    shift_hours: definition.hours,
    shift_price_usd: definition.priceUsd,
    shift_divisa_discount_rule_usd: definition.divisaDiscountUsd,
  };
}

export function fromShiftSnapshotColumns(
  shift: string,
  columns: ShiftSnapshotColumnsRow
): RentalShiftDefinition | undefined {
  const {
    shift_label: label,
    shift_hours: hours,
    shift_price_usd: priceUsd,
    shift_divisa_discount_rule_usd: divisaDiscountUsd,
  } = columns;

  if (
    label == null ||
    hours == null ||
    priceUsd == null ||
    divisaDiscountUsd == null
  ) {
    return undefined;
  }

  return {
    id: shift,
    label,
    hours: Number(hours),
    priceUsd: Number(priceUsd),
    divisaDiscountUsd: Number(divisaDiscountUsd),
  };
}
