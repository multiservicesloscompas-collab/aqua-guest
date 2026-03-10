import type { PaymentMethod, Sale, WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';

interface SplitAwareSale extends Sale {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareRental extends WasherRental {
  paymentSplits?: PaymentSplit[];
}

function findSplitByMethod(
  splits: readonly PaymentSplit[] | undefined,
  method: PaymentMethod
): PaymentSplit | undefined {
  return splits?.find((split) => split.method === method);
}

export function includesMethodInSale(
  sale: SplitAwareSale,
  method: PaymentMethod
): boolean {
  if (sale.paymentSplits?.length) {
    return Boolean(findSplitByMethod(sale.paymentSplits, method));
  }
  return sale.paymentMethod === method;
}

export function getSaleAmountForMethodBs(
  sale: SplitAwareSale,
  method: PaymentMethod
): number {
  const split = findSplitByMethod(sale.paymentSplits, method);
  if (split) return Number(split.amountBs || 0);
  return sale.paymentMethod === method ? Number(sale.totalBs || 0) : 0;
}

export function getSaleAmountForMethodUsd(
  sale: SplitAwareSale,
  method: PaymentMethod,
  exchangeRate: number
): number {
  const split = findSplitByMethod(sale.paymentSplits, method);
  if (split?.amountUsd !== undefined) {
    return Number(split.amountUsd || 0);
  }

  const amountBs = getSaleAmountForMethodBs(sale, method);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}

export function includesMethodInRental(
  rental: SplitAwareRental,
  method: PaymentMethod
): boolean {
  if (rental.paymentSplits?.length) {
    return Boolean(findSplitByMethod(rental.paymentSplits, method));
  }
  return rental.paymentMethod === method;
}

export function getRentalAmountForMethodBs(
  rental: SplitAwareRental,
  method: PaymentMethod,
  exchangeRate: number
): number {
  const split = findSplitByMethod(rental.paymentSplits, method);
  if (split) return Number(split.amountBs || 0);
  return rental.paymentMethod === method
    ? Number(rental.totalUsd || 0) * exchangeRate
    : 0;
}

export function getRentalAmountForMethodUsd(
  rental: SplitAwareRental,
  method: PaymentMethod,
  exchangeRate: number
): number {
  const split = findSplitByMethod(rental.paymentSplits, method);
  if (split?.amountUsd !== undefined) {
    return Number(split.amountUsd || 0);
  }

  const amountBs = getRentalAmountForMethodBs(rental, method, exchangeRate);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}
