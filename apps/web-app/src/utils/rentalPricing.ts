import { RentalShift, RentalShiftConfig, PaymentMethod } from '@/types';

/**
 * Calcula el precio del alquiler basado en la jornada y método de pago
 * Aplica la regla de negocio especial: 24 horas + divisa = $5
 */
export function calculateRentalPrice(
  shift: RentalShift,
  paymentMethod: PaymentMethod,
  deliveryFee = 0
): number {
  const basePrice = RentalShiftConfig[shift].priceUsd;

  // Regla especial: 24 horas + divisa = $5
  if (shift === 'completo' && paymentMethod === 'divisa') {
    return 5 + deliveryFee;
  }

  return basePrice + deliveryFee;
}

/**
 * Obtiene el precio base de una jornada sin aplicar reglas especiales
 */
export function getBaseRentalPrice(shift: RentalShift): number {
  return RentalShiftConfig[shift].priceUsd;
}
