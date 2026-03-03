import { RentalShift, RentalShiftConfig, PaymentMethod } from '@/types';

export function calculateRentalPrice(
  shift: RentalShift,
  paymentMethod: PaymentMethod,
  deliveryFee = 0
): number {
  const basePrice = RentalShiftConfig[shift].priceUsd;

  if (shift === 'completo' && paymentMethod === 'divisa') {
    return 5 + deliveryFee;
  }

  return basePrice + deliveryFee;
}

export function getBaseRentalPrice(shift: RentalShift): number {
  return RentalShiftConfig[shift].priceUsd;
}
