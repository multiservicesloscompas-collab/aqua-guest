import { RentalExtension, WasherRental } from '@/types';
import {
  parse,
  format,
  getDay,
  setHours,
  setMinutes,
  addDays,
  isBefore,
  isAfter,
} from 'date-fns';
import { BUSINESS_HOURS } from '@/types';

export function calculateExtensionFee(additionalHours: number): number {
  if (additionalHours <= 8) {
    return 3; // 8 horas = $3
  } else if (additionalHours <= 24) {
    return 5; // 24 horas = $5
  } else {
    // Más de 24 horas: $5 base + $3 por cada 8 horas adicionales
    const extraHours = additionalHours - 24;
    const extraBlocks = Math.ceil(extraHours / 8);
    return 5 + extraBlocks * 3;
  }
}

export function calculateExtendedPickupTime(
  currentPickupDate: string,
  currentPickupTime: string,
  additionalHours: number
): { pickupTime: string; pickupDate: string } {
  const currentPickupDateTime = parse(
    `${currentPickupDate} ${currentPickupTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );

  let newPickupDateTime = new Date(
    currentPickupDateTime.getTime() + additionalHours * 60 * 60 * 1000
  );

  const pickupDay = getDay(newPickupDateTime);
  const isSunday = pickupDay === 0;
  const openHour = BUSINESS_HOURS.openHour;
  const closeHour = isSunday
    ? BUSINESS_HOURS.sundayCloseHour
    : BUSINESS_HOURS.closeHour;
  const openTime = setMinutes(
    setHours(new Date(newPickupDateTime), openHour),
    0
  );
  const closeTime = setMinutes(
    setHours(new Date(newPickupDateTime), closeHour),
    0
  );

  const isWithinBusinessHours =
    !isBefore(newPickupDateTime, openTime) &&
    !isAfter(newPickupDateTime, closeTime);

  if (!isWithinBusinessHours) {
    if (
      BUSINESS_HOURS.workDays.includes(pickupDay) &&
      isBefore(newPickupDateTime, openTime)
    ) {
      newPickupDateTime = openTime;
    } else {
      // Mover al siguiente día laboral a la hora de apertura
      let nextDay = addDays(new Date(newPickupDateTime), 1);
      while (!BUSINESS_HOURS.workDays.includes(getDay(nextDay))) {
        nextDay = addDays(nextDay, 1);
      }
      newPickupDateTime = setMinutes(
        setHours(nextDay, BUSINESS_HOURS.openHour),
        0
      );
    }
  }

  return {
    pickupTime: format(newPickupDateTime, 'HH:mm'),
    pickupDate: format(newPickupDateTime, 'yyyy-MM-dd'),
  };
}

export function createRentalExtension(
  rentalId: string,
  additionalHours: number,
  notes?: string
): RentalExtension {
  return {
    id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    rentalId,
    additionalHours,
    additionalFee: calculateExtensionFee(additionalHours),
    notes,
    createdAt: new Date().toISOString(),
  };
}

export function applyExtensionToRental(
  rental: WasherRental,
  extension: RentalExtension
): WasherRental {
  const hasOriginalValues =
    rental.originalPickupTime && rental.originalPickupDate;

  const updatedRental: WasherRental = {
    ...rental,
    originalPickupTime: hasOriginalValues
      ? rental.originalPickupTime
      : rental.pickupTime,
    originalPickupDate: hasOriginalValues
      ? rental.originalPickupDate
      : rental.pickupDate,
    extensions: [...(rental.extensions || []), extension],
    totalUsd: rental.totalUsd + extension.additionalFee,
    updatedAt: new Date().toISOString(),
  };

  const newPickupInfo = calculateExtendedPickupTime(
    rental.pickupDate,
    rental.pickupTime,
    extension.additionalHours
  );

  updatedRental.pickupTime = newPickupInfo.pickupTime;
  updatedRental.pickupDate = newPickupInfo.pickupDate;

  return updatedRental;
}

export function getTotalExtendedHours(rental: WasherRental): number {
  if (!rental.extensions || rental.extensions.length === 0) {
    return 0;
  }
  return rental.extensions.reduce(
    (sum: number, ext: RentalExtension) => sum + ext.additionalHours,
    0
  );
}

export function getTotalExtensionFees(rental: WasherRental): number {
  if (!rental.extensions || rental.extensions.length === 0) {
    return 0;
  }
  return rental.extensions.reduce(
    (sum: number, ext: RentalExtension) => sum + ext.additionalFee,
    0
  );
}

export function removeExtensionFromRental(
  rental: WasherRental,
  extensionId: string
): WasherRental {
  const extensionToRemove = rental.extensions?.find(
    (ext: RentalExtension) => ext.id === extensionId
  );

  if (!extensionToRemove) {
    return rental;
  }

  const updatedExtensions = (rental.extensions || []).filter(
    (ext: RentalExtension) => ext.id !== extensionId
  );

  if (updatedExtensions.length === 0) {
    return {
      ...rental,
      extensions: [],
      pickupTime: rental.originalPickupTime || rental.pickupTime,
      pickupDate: rental.originalPickupDate || rental.pickupDate,
      totalUsd: rental.totalUsd - extensionToRemove.additionalFee,
      updatedAt: new Date().toISOString(),
    };
  }

  const baseRental: WasherRental = {
    ...rental,
    extensions: [],
    pickupTime: rental.originalPickupTime || rental.pickupTime,
    pickupDate: rental.originalPickupDate || rental.pickupDate,
    totalUsd: rental.totalUsd - getTotalExtensionFees(rental), // Restar todas las tarifas de extensión
  };

  let updatedRental = { ...baseRental };
  for (const extension of updatedExtensions) {
    updatedRental = applyExtensionToRental(updatedRental, extension);
  }

  return updatedRental;
}

export function canExtendRental(rental: WasherRental): boolean {
  return rental.status !== 'finalizado' || Boolean(rental.extensions?.length);
}

export const EXTENSION_OPTIONS = [
  { hours: 8, label: '8 horas', fee: calculateExtensionFee(8) },
  { hours: 24, label: '24 horas', fee: calculateExtensionFee(24) },
];
