import type {
  Expense,
  PaymentMethod,
  PaymentSplit,
  Sale,
  SplitAware,
  WasherRental,
} from '@aqua-guest/domain';
import {
  hasPersistedPaymentSplits,
  hasValidMixedPaymentSplits,
} from '@/services/payments/paymentSplitValidity';

/**
 * Sums every split row for a method rather than returning the first match.
 * Required for divisa-with-change records, which carry two `divisa` rows
 * (the tendered bill and the change given back) — a `find` would silently
 * ignore the second one.
 */
function sumSplitsByMethod(
  splits: readonly PaymentSplit[] | undefined,
  method: PaymentMethod,
  key: 'amountBs' | 'amountUsd'
): number | undefined {
  const matches = splits?.filter((split) => split.method === method) ?? [];
  if (matches.length === 0) return undefined;

  let sum = 0;
  let hasDefinedValue = false;

  for (const split of matches) {
    const value = split[key];
    if (value === undefined) continue;
    hasDefinedValue = true;
    sum += Number(value || 0);
  }

  return hasDefinedValue || key === 'amountBs' ? sum : undefined;
}

export function includesMethodInSale(
  sale: SplitAware<Sale>,
  method: PaymentMethod
): boolean {
  if (hasPersistedPaymentSplits(sale.paymentSplits)) {
    return sale.paymentSplits.some((split) => split.method === method);
  }
  return sale.paymentMethod === method;
}

export function getSaleAmountForMethodBs(
  sale: SplitAware<Sale>,
  method: PaymentMethod
): number {
  if (hasPersistedPaymentSplits(sale.paymentSplits)) {
    return sumSplitsByMethod(sale.paymentSplits, method, 'amountBs') ?? 0;
  }
  return sale.paymentMethod === method ? Number(sale.totalBs || 0) : 0;
}

export function getSaleAmountForMethodUsd(
  sale: SplitAware<Sale>,
  method: PaymentMethod,
  exchangeRate: number
): number {
  if (hasPersistedPaymentSplits(sale.paymentSplits)) {
    const summedUsd = sumSplitsByMethod(sale.paymentSplits, method, 'amountUsd');
    if (summedUsd !== undefined) {
      return summedUsd;
    }
  }

  const amountBs = getSaleAmountForMethodBs(sale, method);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}

export function includesMethodInRental(
  rental: SplitAware<WasherRental>,
  method: PaymentMethod
): boolean {
  if (hasPersistedPaymentSplits(rental.paymentSplits)) {
    return rental.paymentSplits.some((split) => split.method === method);
  }
  return rental.paymentMethod === method;
}

export function getRentalAmountForMethodBs(
  rental: SplitAware<WasherRental>,
  method: PaymentMethod,
  exchangeRate: number
): number {
  if (hasPersistedPaymentSplits(rental.paymentSplits)) {
    return sumSplitsByMethod(rental.paymentSplits, method, 'amountBs') ?? 0;
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
  if (hasPersistedPaymentSplits(rental.paymentSplits)) {
    const summedUsd = sumSplitsByMethod(
      rental.paymentSplits,
      method,
      'amountUsd'
    );
    if (summedUsd !== undefined) {
      return summedUsd;
    }
  }

  const amountBs = getRentalAmountForMethodBs(rental, method, exchangeRate);
  return exchangeRate > 0 ? amountBs / exchangeRate : 0;
}

// Expenses are out of scope for the divisa-change feature and deliberately
// stay on the strict hasValidMixedPaymentSplits gate — change rows never
// reach this table (see paymentSplitSchemaContract / the DB migration), but
// keeping the stricter gate here means Expenses attribution is unaffected
// by anything this file does for sales/rentals.
export function includesMethodInExpense(
  expense: SplitAware<Expense>,
  method: PaymentMethod
): boolean {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    return expense.paymentSplits.some((split) => split.method === method);
  }
  return expense.paymentMethod === method;
}

export function getExpenseAmountForMethodBs(
  expense: SplitAware<Expense>,
  method: PaymentMethod
): number {
  if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
    return (
      sumSplitsByMethod(expense.paymentSplits, method, 'amountBs') ?? 0
    );
  }
  return expense.paymentMethod === method ? Number(expense.amount || 0) : 0;
}
