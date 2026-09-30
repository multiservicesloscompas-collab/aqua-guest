import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { getPaymentMethods } from '@/services/payments/paymentSplitReadModel';

function isFinitePositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidSplitMethod(method: string): method is PaymentMethod {
  return getPaymentMethods().includes(method as PaymentMethod);
}

export function hasValidMixedPaymentSplits(
  splits: readonly PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  if (!splits || splits.length < 2) {
    return false;
  }

  const uniqueMethods = new Set<PaymentMethod>();

  for (const split of splits) {
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
 * True when the record carries stored payments we can trust as historical
 * amounts (one or more valid splits), unlike `hasValidMixedPaymentSplits`,
 * which only accepts 2+ distinct methods.
 */
export function hasPersistedPaymentSplits(
  splits: readonly PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  if (!splits || splits.length === 0) {
    return false;
  }

  return splits.every(
    (split) =>
      isValidSplitMethod(split.method) && isFinitePositiveNumber(split.amountBs)
  );
}
