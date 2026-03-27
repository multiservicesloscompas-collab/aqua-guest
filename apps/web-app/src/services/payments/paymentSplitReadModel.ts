import type { PaymentMethod, Sale, WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';

type MethodTotals = Record<PaymentMethod, number>;

const PAYMENT_METHODS: PaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

interface SplitAwareSale extends Sale {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareRental extends WasherRental {
  paymentSplits?: PaymentSplit[];
}

export function createEmptyMethodTotals(): MethodTotals {
  return {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };
}

function allocateSplitsToTotals(
  splits: readonly PaymentSplit[],
  totals: MethodTotals
): MethodTotals {
  const next = { ...totals };
  for (const split of splits) {
    next[split.method] += Number(split.amountBs || 0);
  }
  return next;
}

export function allocateSaleToMethodTotalsBs(
  sale: SplitAwareSale,
  totals: MethodTotals = createEmptyMethodTotals()
): MethodTotals {
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
  rental: SplitAwareRental,
  exchangeRate: number,
  totals: MethodTotals = createEmptyMethodTotals()
): MethodTotals {
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
