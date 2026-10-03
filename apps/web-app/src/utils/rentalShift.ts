import {
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  isRentalShift,
  type RentalShift,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import { match, P } from 'ts-pattern';
import { RentalShiftConfig, type WasherRental } from '@/types';

type ResolvableRental = Pick<
  WasherRental,
  'shift' | 'shiftSnapshot' | 'totalUsd' | 'deliveryFee'
>;

function deriveDefinitionFromAmounts(
  rental: ResolvableRental
): RentalShiftDefinition {
  return {
    id: rental.shift,
    label: rental.shift,
    priceUsd: Math.max(0, rental.totalUsd - rental.deliveryFee),
    hours: 0,
    divisaDiscountUsd: 0,
  };
}

export function resolveRentalShift(
  rental: ResolvableRental
): RentalShiftDefinition {
  return match(rental)
    .with(
      { shiftSnapshot: P.nonNullable },
      ({ shiftSnapshot }) => shiftSnapshot
    )
    .with(
      { shift: P.when(isRentalShift) },
      ({ shift }) => LEGACY_SHIFT_DEFINITIONS[shift]
    )
    .otherwise(deriveDefinitionFromAmounts);
}

export function resolveEditedRentalShift(
  rental: ResolvableRental | null,
  shift: RentalShift
): RentalShiftDefinition {
  return rental?.shift === shift
    ? resolveRentalShift(rental)
    : RentalShiftConfig[shift];
}

export function getShiftMetricLabel(shift: string): string {
  return match(shift)
    .with(RENTAL_SHIFT.medio, () => 'Medio Turno')
    .with(RENTAL_SHIFT.completo, () => 'Turno Completo')
    .with(RENTAL_SHIFT.doble, () => 'Turno Doble')
    .otherwise((unknownShift) => unknownShift);
}
