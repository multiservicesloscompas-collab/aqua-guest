import {
  DEFAULT_RENTAL_SHIFT,
  LEGACY_SHIFT_DEFINITIONS,
  isLegacyRentalShift,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import { resolveRentalShift, type ResolvableRental } from './rentalShift';

export const UNKNOWN_SHIFT_ERROR =
  'El turno del alquiler no existe en el catálogo';

export type RentalShiftCatalog = ReadonlyArray<RentalShiftDefinition>;

function toShiftDefinition(
  definition: RentalShiftDefinition
): RentalShiftDefinition {
  return {
    id: definition.id,
    label: definition.label,
    priceUsd: definition.priceUsd,
    hours: definition.hours,
    divisaDiscountUsd: definition.divisaDiscountUsd,
  };
}

export function findShiftDefinition(
  catalog: RentalShiftCatalog,
  shift: string
): RentalShiftDefinition | undefined {
  const fromCatalog = catalog.find((definition) => definition.id === shift);
  if (fromCatalog) return toShiftDefinition(fromCatalog);
  return isLegacyRentalShift(shift)
    ? LEGACY_SHIFT_DEFINITIONS[shift]
    : undefined;
}

export function resolveShiftDefinitionOrDefault(
  catalog: RentalShiftCatalog,
  shift: string
): RentalShiftDefinition {
  return (
    findShiftDefinition(catalog, shift) ??
    LEGACY_SHIFT_DEFINITIONS[DEFAULT_RENTAL_SHIFT]
  );
}

export function listSelectableShifts(
  catalog: RentalShiftCatalog,
  rental: ResolvableRental | null
): RentalShiftCatalog {
  if (!rental) return catalog;

  const rentalDefinition = resolveRentalShift(rental);
  const isInCatalog = catalog.some(
    (definition) => definition.id === rentalDefinition.id
  );

  return isInCatalog
    ? catalog.map((definition) =>
        definition.id === rentalDefinition.id ? rentalDefinition : definition
      )
    : [...catalog, rentalDefinition];
}

export function resolveEditedRentalShift(
  rental: ResolvableRental | null,
  shift: string,
  catalog: RentalShiftCatalog
): RentalShiftDefinition {
  return rental?.shift === shift
    ? resolveRentalShift(rental)
    : resolveShiftDefinitionOrDefault(catalog, shift);
}
