import { RentalExtension, WasherRental } from '@/types';
import { addHours, parse, format } from 'date-fns';

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

  // Calcular nueva hora de retiro
  const currentPickupDateTime = parse(
    `${rental.pickupDate} ${rental.pickupTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );
  
  const newPickupDateTime = addHours(currentPickupDateTime, extension.additionalHours);
  
  updatedRental.pickupTime = format(newPickupDateTime, 'HH:mm');
  updatedRental.pickupDate = format(newPickupDateTime, 'yyyy-MM-dd');

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
