import type { PaymentMethod, Sale, WasherRental, Expense } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';

interface SplitAwareSale extends Sale {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareRental extends WasherRental {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareExpense extends Expense {
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
  if (hasValidMixedPaymentSplits(sale.paymentSplits)) {
    return Boolean(findSplitByMethod(sale.paymentSplits, method));
  }
  return sale.paymentMethod === method;
}

export function getSaleAmountForMethodBs(
  sale: SplitAwareSale,
  method: PaymentMethod
): number {
  if (hasValidMixedPaymentSplits(sale.paymentSplits)) {
    const split = findSplitByMethod(sale.paymentSplits, method);
    if (split) return Number(split.amountBs || 0);
  }
  return sale.paymentMethod === method ? Number(sale.totalBs || 0) : 0;
}

export function getSaleAmountForMethodUsd(
  sale: SplitAwareSale,
  method: PaymentMethod,
  exchangeRate: number
): number {
  if (hasValidMixedPaymentSplits(sale.paymentSplits)) {
    const split = findSplitByMethod(sale.paymentSplits, method);
    if (split?.amountUsd !== undefined) {
      return Number(split.amountUsd || 0);
    }
  }

  const amountBs = getSaleAmountForMethodBs(sale, method);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}

export function includesMethodInRental(
  rental: SplitAwareRental,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(rental.paymentSplits)) {
    return Boolean(findSplitByMethod(rental.paymentSplits, method));
  }
  return rental.paymentMethod === method;
}

export function getRentalAmountForMethodBs(
  rental: SplitAwareRental,
  method: PaymentMethod,
  exchangeRate: number
): number {
  if (hasValidMixedPaymentSplits(rental.paymentSplits)) {
    const split = findSplitByMethod(rental.paymentSplits, method);
    if (split) return Number(split.amountBs || 0);
  }
  return rental.paymentMethod === method
    ? Number(rental.totalUsd || 0) * exchangeRate
    : 0;
}

export function getRentalAmountForMethodUsd(
  rental: SplitAwareRental,
  method: PaymentMethod,
  exchangeRate: number
): number {
  if (hasValidMixedPaymentSplits(rental.paymentSplits)) {
    const split = findSplitByMethod(rental.paymentSplits, method);
    if (split?.amountUsd !== undefined) {
      return Number(split.amountUsd || 0);
    }
  }

  const amountBs = getRentalAmountForMethodBs(rental, method, exchangeRate);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}

export function includesMethodInExpense(
  expense: SplitAwareExpense,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    return Boolean(findSplitByMethod(expense.paymentSplits, method));
  }
  return expense.paymentMethod === method;
}

export function getExpenseAmountForMethodBs(
  expense: SplitAwareExpense,
  method: PaymentMethod
): number {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    const split = findSplitByMethod(expense.paymentSplits, method);
    if (split) return Number(split.amountBs || 0);
  }
  return expense.paymentMethod === method ? Number(expense.amount || 0) : 0;
}
