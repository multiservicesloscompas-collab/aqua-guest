import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import { isChangeSplit } from '@aqua-guest/domain';
import { getPaymentMethods } from '@/services/payments/paymentSplitReadModel';

function isFinitePositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isFiniteNonZeroNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0;
}

function isValidSplitMethod(method: string): method is PaymentMethod {
  return getPaymentMethods().includes(method as PaymentMethod);
}

/**
 * Structural validity for attribution: every persisted split (payment or
 * change) with a valid method and a non-zero finite Bs amount. No sign
 * check — a divisa-with-change record must pass this, or attribution falls
 * back to the legacy single-method path and silently misattributes the
 * whole total to one method.
 */
export function hasPersistedPaymentSplits(
  splits: readonly PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  if (!splits || splits.length === 0) {
    return false;
  }

  return splits.every(
    (split) =>
      isValidSplitMethod(split.method) && isFiniteNonZeroNumber(split.amountBs)
  );
}

/**
 * True only for an ordinary mixed payment: two or more POSITIVE payment
 * rows across two or more distinct methods. Deliberately excludes change
 * rows — a divisa payment with change is not a "Pago mixto" and must not be
 * labeled as one.
 */
export function hasValidMixedPaymentSplits(
  splits: readonly PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  if (!splits) {
    return false;
  }

  const paymentSplits = splits.filter((split) => !isChangeSplit(split));

  if (paymentSplits.length < 2) {
    return false;
  }

  const uniqueMethods = new Set<PaymentMethod>();

  for (const split of paymentSplits) {
    if (!isValidSplitMethod(split.method)) {
      return false;
    }
    if (!isFinitePositiveNumber(split.amountBs)) {
      return false;
    }
    uniqueMethods.add(split.method);
  }

  return uniqueMethods.size >= 2;
}

/**
 * Deliberately returns a plain boolean, not a `splits is PaymentSplit[]`
 * type predicate: callers use this on already-non-undefined arrays as
 * often as on possibly-undefined ones, and a predicate whose asserted type
 * coincides with an already-narrowed argument collapses the negated branch
 * to `never` (TS subtracts the same type from itself). Callers that need
 * the non-undefined narrowing get it from their own truthy check instead.
 */
export function hasChangeSplits(
  splits: readonly PaymentSplit[] | undefined
): boolean {
  return Boolean(splits?.some((split) => isChangeSplit(split)));
}
