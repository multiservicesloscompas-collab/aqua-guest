import {
  resolveShiftConfig,
  type RentalShiftConfig,
} from '@aqua-guest/domain';
import type { PaymentMethod } from '@aqua-guest/domain';

const DIVISA: PaymentMethod = 'divisa';

export interface CalculateRentalPriceOptions {
  dynamicShifts?: ReadonlyArray<RentalShiftConfig>;
}

export interface CalculateRentalPriceParams {
  shift: string;
  paymentMethod: PaymentMethod;
  deliveryFee?: number;
}

export function calculateRentalPrice(
  shift: string,
  paymentMethod: PaymentMethod,
  deliveryFee = 0,
  options: CalculateRentalPriceOptions = {}
): number {
  const config = resolveShiftConfig(shift, options.dynamicShifts);

  if (!config) {
    return 0 + deliveryFee;
  }

  const basePrice = Number(config.priceUsd) || 0;
  const shouldApplyDiscount =
    Boolean(config.hasDivisaDiscount) && paymentMethod === DIVISA;
  const discount = shouldApplyDiscount
    ? Number(config.divisaDiscountAmount) || 0
    : 0;
  const finalBase = Math.max(0, basePrice - discount);

  return finalBase + deliveryFee;
}
