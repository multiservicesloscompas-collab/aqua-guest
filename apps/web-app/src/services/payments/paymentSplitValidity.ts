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
