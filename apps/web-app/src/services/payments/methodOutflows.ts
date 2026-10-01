import type { Expense, TipPayout } from '@/types';
import { createEmptyMethodTotals } from '@/services/payments/paymentSplitReadModel';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';
import type { PaymentMethodTotals } from '@aqua-guest/domain';
import { normalizeToVenezuelaDate } from '@/services/DateService';

export function computeExpenseTotalsByMethod(
  expenses: readonly Expense[]
): PaymentMethodTotals {
  const totals = createEmptyMethodTotals();

  for (const expense of expenses) {
    if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
      for (const split of expense.paymentSplits) {
        totals[split.method] += Number(split.amountBs || 0);
      }
      continue;
    }

    totals[expense.paymentMethod] += Number(expense.amount || 0);
  }

  return totals;
}

export function resolveTipPayoutDate(payout: TipPayout): string {
  return normalizeToVenezuelaDate(payout.paidAt || payout.tipDate);
}

export function dedupeTipPayouts(payouts: readonly TipPayout[]): TipPayout[] {
  const uniqueById = new Map<string, TipPayout>();
  for (const payout of payouts) {
    if (!uniqueById.has(payout.id)) {
      uniqueById.set(payout.id, payout);
    }
  }
  return Array.from(uniqueById.values());
}
