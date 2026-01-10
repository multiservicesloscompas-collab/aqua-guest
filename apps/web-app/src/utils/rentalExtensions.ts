import { RentalExtension, WasherRental } from '@/types';
import { parse, format, getDay, setHours, setMinutes, addDays, isBefore, isAfter } from 'date-fns';
import { BUSINESS_HOURS } from '@/types';

/**
 * Calcula el precio de extensión basado en las reglas de jornadas
 * - 8 horas = $3 (1 dólar menos que medio turno)
 * - 24 horas = $5 (1 dólar menos que turno completo)
 * - Más de 24 horas = $5 + $3 por cada 8 horas adicionales
 */
export function calculateExtensionFee(additionalHours: number): number {
  if (additionalHours <= 8) {
    return 3; // 8 horas = $3
  } else if (additionalHours <= 24) {
    return 5; // 24 horas = $5
  } else {
    // Más de 24 horas: $5 base + $3 por cada 8 horas adicionales
    const extraHours = additionalHours - 24;
    const extraBlocks = Math.ceil(extraHours / 8);
    return 5 + (extraBlocks * 3);
  }
}

/**
 * Calcula la nueva hora de retiro con extensión respetando el horario comercial
 */
export function calculateExtendedPickupTime(
  currentPickupDate: string,
  currentPickupTime: string,
  additionalHours: number
): { pickupTime: string; pickupDate: string } {
  // Parsear la fecha/hora actual de retiro
  const currentPickupDateTime = parse(
    `${currentPickupDate} ${currentPickupTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );

  // Agregar las horas de extensión
  let newPickupDateTime = new Date(
    currentPickupDateTime.getTime() + additionalHours * 60 * 60 * 1000
  );

  // Determinar horario del día de retiro calculado
  const pickupDay = getDay(newPickupDateTime);
  const isSunday = pickupDay === 0;
  const openHour = BUSINESS_HOURS.openHour;
  const closeHour = isSunday
    ? BUSINESS_HOURS.sundayCloseHour
    : BUSINESS_HOURS.closeHour;
  const openTime = setMinutes(setHours(new Date(newPickupDateTime), openHour), 0);
  const closeTime = setMinutes(
    setHours(new Date(newPickupDateTime), closeHour),
    0
  );

  // Verificar si el pickupTime está dentro del horario laboral
  const isWithinBusinessHours =
    !isBefore(newPickupDateTime, openTime) && !isAfter(newPickupDateTime, closeTime);

  if (!isWithinBusinessHours) {
    // Si el día calculado es laboral y la hora es antes de apertura, establecer a apertura del mismo día
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

/**
 * Crea una extensión de alquiler
 */
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

/**
 * Aplica una extensión a un alquiler existente
 */
export function applyExtensionToRental(
  rental: WasherRental,
  extension: RentalExtension
): WasherRental {
  // Guardar valores originales si es la primera extensión
  const hasOriginalValues = rental.originalPickupTime && rental.originalPickupDate;
  
  const updatedRental = {
    ...rental,
    originalPickupTime: hasOriginalValues ? rental.originalPickupTime : rental.pickupTime,
    originalPickupDate: hasOriginalValues ? rental.originalPickupDate : rental.pickupDate,
    extensions: [...(rental.extensions || []), extension],
    totalUsd: rental.totalUsd + extension.additionalFee,
    updatedAt: new Date().toISOString(),
  };

  // Calcular nueva hora de retiro respetando el horario comercial
  const newPickupInfo = calculateExtendedPickupTime(
    rental.pickupDate,
    rental.pickupTime,
    extension.additionalHours
  );
  
  updatedRental.pickupTime = newPickupInfo.pickupTime;
  updatedRental.pickupDate = newPickupInfo.pickupDate;

  return updatedRental;
}

/**
 * Obtiene el total de horas extendidas para un alquiler
 */
export function getTotalExtendedHours(rental: WasherRental): number {
  if (!rental.extensions || rental.extensions.length === 0) {
    return 0;
  }
  return rental.extensions.reduce((sum: number, ext: RentalExtension) => sum + ext.additionalHours, 0);
}

/**
 * Obtiene el total de cargos por extensión
 */
export function getTotalExtensionFees(rental: WasherRental): number {
  if (!rental.extensions || rental.extensions.length === 0) {
    return 0;
  }
  return rental.extensions.reduce((sum: number, ext: RentalExtension) => sum + ext.additionalFee, 0);
}

/**
 * Elimina una extensión de un alquiler y recalcula los valores
 */
export function removeExtensionFromRental(
  rental: WasherRental,
  extensionId: string
): WasherRental {
  const extensionToRemove = rental.extensions?.find((ext: RentalExtension) => ext.id === extensionId);
  
  if (!extensionToRemove) {
    return rental;
  }

  // Filtrar la extensión eliminada
  const updatedExtensions = (rental.extensions || []).filter((ext: RentalExtension) => ext.id !== extensionId);
  
  // Si no hay más extensiones, restaurar valores originales
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

  // Si quedan extensiones, recalcular desde el principio
  const baseRental = {
    ...rental,
    extensions: [],
    pickupTime: rental.originalPickupTime || rental.pickupTime,
    pickupDate: rental.originalPickupDate || rental.pickupDate,
    totalUsd: rental.totalUsd - getTotalExtensionFees(rental), // Restar todas las tarifas de extensión
  };

  // Aplicar las extensiones restantes en orden
  let updatedRental = { ...baseRental };
  for (const extension of updatedExtensions) {
    updatedRental = applyExtensionToRental(updatedRental, extension);
  }

  return updatedRental;
}

/**
 * Verifica si un alquiler puede ser extendido
 * Solo se pueden extender alquileres que no estén finalizados
 * Pero se muestra el diálogo para gestionar extensiones existentes
 */
export function canExtendRental(rental: WasherRental): boolean {
  return rental.status !== 'finalizado' || (rental.extensions && rental.extensions.length > 0);
}

/**
 * Opciones predefinidas de horas de extensión
 */
export const EXTENSION_OPTIONS = [
  { hours: 8, label: '8 horas', fee: calculateExtensionFee(8) },
  { hours: 24, label: '24 horas', fee: calculateExtensionFee(24) },
];
