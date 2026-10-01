import type { PaymentMethod, Sale, WasherRental } from '@/types';
import type { PaymentMethodTotals, PaymentSplit } from '@aqua-guest/domain';
import { PAYMENT_METHODS } from './paymentMethods';

export function createEmptyMethodTotals(): PaymentMethodTotals {
  return {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };
}

function allocateSplitsToTotals(
  splits: readonly PaymentSplit[],
  totals: PaymentMethodTotals
): PaymentMethodTotals {
  const next = { ...totals };
  for (const split of splits) {
    next[split.method] += Number(split.amountBs || 0);
  }
  return next;
}

export function allocateSaleToMethodTotalsBs(
  sale: Sale,
  totals: PaymentMethodTotals = createEmptyMethodTotals()
): PaymentMethodTotals {
  if (sale.paymentSplits?.length) {
    return allocateSplitsToTotals(sale.paymentSplits, totals);
  }

  return {
    ...totals,
    [sale.paymentMethod]:
      totals[sale.paymentMethod] + Number(sale.totalBs || 0),
  };
}

export function allocateRentalToMethodTotalsBs(
  rental: WasherRental,
  exchangeRate: number,
  totals: PaymentMethodTotals = createEmptyMethodTotals()
): PaymentMethodTotals {
  if (rental.paymentSplits?.length) {
    return allocateSplitsToTotals(rental.paymentSplits, totals);
  }

  const fallbackAmountBs = Number(rental.totalUsd || 0) * exchangeRate;
  return {
    ...totals,
    [rental.paymentMethod]: totals[rental.paymentMethod] + fallbackAmountBs,
  };
}

export function getPaymentMethods(): readonly PaymentMethod[] {
  return PAYMENT_METHODS;
}
