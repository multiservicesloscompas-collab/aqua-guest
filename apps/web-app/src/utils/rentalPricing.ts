import { PAYMENT_METHOD, type RentalShiftDefinition } from '@aqua-guest/domain';
import { PaymentMethod, WasherRental } from '@/types';
import { resolveRentalShift } from './rentalShift';

export function calculateShiftBasePrice(
  definition: RentalShiftDefinition,
  paymentMethod: PaymentMethod
): number {
  const discount =
    paymentMethod === PAYMENT_METHOD.divisa ? definition.divisaDiscountUsd : 0;

  return Math.max(0, definition.priceUsd - discount);
}

export function calculateRentalPrice(
  definition: RentalShiftDefinition,
  paymentMethod: PaymentMethod,
  deliveryFee = 0
): number {
  return calculateShiftBasePrice(definition, paymentMethod) + deliveryFee;
}

export function calculateRentalSubtotalUsd(
  rental: Pick<WasherRental, 'shift' | 'paymentMethod' | 'totalUsd'> &
    Partial<Pick<WasherRental, 'deliveryFee' | 'shiftSnapshot'>>
): number {
  const deliveryFee = Number(rental.deliveryFee) || 0;
  const definition = resolveRentalShift({ ...rental, deliveryFee });

  return (
    calculateShiftBasePrice(definition, rental.paymentMethod) + deliveryFee
  );
}
