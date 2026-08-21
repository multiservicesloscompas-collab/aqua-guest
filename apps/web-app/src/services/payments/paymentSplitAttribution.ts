import type {
  Expense,
  PaymentMethod,
  PaymentSplit,
  Sale,
  SplitAware,
  WasherRental,
} from '@aqua-guest/domain';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';

function findSplitByMethod(
  splits: readonly PaymentSplit[] | undefined,
  method: PaymentMethod
): PaymentSplit | undefined {
  return splits?.find((split) => split.method === method);
}

export function includesMethodInSale(
  sale: SplitAware<Sale>,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(sale.paymentSplits)) {
    return Boolean(findSplitByMethod(sale.paymentSplits, method));
  }
  return sale.paymentMethod === method;
}

export function getSaleAmountForMethodBs(
  sale: SplitAware<Sale>,
  method: PaymentMethod
): number {
  if (hasValidMixedPaymentSplits(sale.paymentSplits)) {
    const split = findSplitByMethod(sale.paymentSplits, method);
    if (split) return Number(split.amountBs || 0);
  }
  return sale.paymentMethod === method ? Number(sale.totalBs || 0) : 0;
}

export function getSaleAmountForMethodUsd(
  sale: SplitAware<Sale>,
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
  rental: SplitAware<WasherRental>,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(rental.paymentSplits)) {
    return Boolean(findSplitByMethod(rental.paymentSplits, method));
  }
  return rental.paymentMethod === method;
}

export function getRentalAmountForMethodBs(
  rental: SplitAware<WasherRental>,
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
  rental: SplitAware<WasherRental>,
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
  expense: SplitAware<Expense>,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    return Boolean(findSplitByMethod(expense.paymentSplits, method));
  }
  return expense.paymentMethod === method;
}

export function getExpenseAmountForMethodBs(
  expense: SplitAware<Expense>,
  method: PaymentMethod
): number {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    const split = findSplitByMethod(expense.paymentSplits, method);
    if (split) return Number(split.amountBs || 0);
  }
  return expense.paymentMethod === method ? Number(expense.amount || 0) : 0;
}
