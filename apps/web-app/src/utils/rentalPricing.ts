import { PAYMENT_METHOD, type RentalShiftDefinition } from '@aqua-guest/domain';
import {
  RentalShift,
  RentalShiftConfig,
  PaymentMethod,
  WasherRental,
} from '@/types';

export function calculateShiftBasePrice(
  definition: RentalShiftDefinition,
  paymentMethod: PaymentMethod
): number {
  const discount =
    paymentMethod === PAYMENT_METHOD.divisa ? definition.divisaDiscountUsd : 0;

  return Math.max(0, definition.priceUsd - discount);
}

export function calculateRentalPrice(
  shift: RentalShift,
  paymentMethod: PaymentMethod,
  deliveryFee = 0
): number {
  return (
    calculateShiftBasePrice(RentalShiftConfig[shift], paymentMethod) +
    deliveryFee
  );
}

export function calculateRentalSubtotalUsd(
  rental: Pick<WasherRental, 'shift' | 'paymentMethod'> &
    Partial<Pick<WasherRental, 'deliveryFee'>>
): number {
  return calculateRentalPrice(
    rental.shift,
    rental.paymentMethod,
    Number(rental.deliveryFee) || 0
  );
}

export function getBaseRentalPrice(shift: RentalShift): number {
  return RentalShiftConfig[shift].priceUsd;
}
