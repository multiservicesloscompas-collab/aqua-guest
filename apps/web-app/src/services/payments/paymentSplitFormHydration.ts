import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@aqua-guest/domain';
import { removeTipFromPaymentSplits } from '@/services/transactions/transactionTotals';
import { hasValidMixedPaymentSplits } from './paymentSplitValidity';

interface ResolveSplitFormHydrationInput {
  paymentMethod: PaymentMethod;
  paymentSplits?: readonly PaymentSplit[];
  totalBs: number;
  /**
   * Tip already stored inside `paymentSplits` (on its capture method). Edit
   * forms work with principal-only splits, so it is taken out before hydrating.
   */
  tip?: { amountBs: number; paymentMethod: PaymentMethod };
}

export interface SplitFormHydrationState {
  paymentMethod: PaymentMethod;
  split1Amount: string;
  split2Method: PaymentMethod;
  isMixedPayment: boolean;
}

function pickAlternativeMethod(method: PaymentMethod): PaymentMethod {
  return method === 'efectivo' ? 'pago_movil' : 'efectivo';
}

function sortSplitsByPriority(splits: readonly PaymentSplit[]): PaymentSplit[] {
  return [...splits].sort((a, b) => {
    if (b.amountBs !== a.amountBs) {
      return b.amountBs - a.amountBs;
    }
    return a.method.localeCompare(b.method);
  });
}

function toAmountInput(amountBs: number): string {
  return String(Number.isFinite(amountBs) ? amountBs : 0);
}

export function resolveSplitFormHydrationState(
  input: ResolveSplitFormHydrationInput
): SplitFormHydrationState {
  const { tip } = input;
  const paymentSplits = tip
    ? removeTipFromPaymentSplits({
        paymentSplits: input.paymentSplits,
        tipAmountBs: tip.amountBs,
        tipPaymentMethod: tip.paymentMethod,
      })
    : input.paymentSplits;
  const paymentMethod =
    tip && paymentSplits?.length === 1
      ? paymentSplits[0].method
      : input.paymentMethod;

  if (hasValidMixedPaymentSplits(paymentSplits)) {
    const sortedSplits = sortSplitsByPriority(paymentSplits);
    const primarySplit = sortedSplits[0];
    const secondarySplit =
      sortedSplits.find((split) => split.method !== primarySplit.method) ??
      sortedSplits[1];

    return {
      paymentMethod: primarySplit.method,
      split1Amount: toAmountInput(secondarySplit?.amountBs ?? 0),
      split2Method:
        secondarySplit?.method ?? pickAlternativeMethod(primarySplit.method),
      isMixedPayment: true,
    };
  }

  const fallbackPrimaryMethod = paymentMethod;

  return {
    paymentMethod: fallbackPrimaryMethod,
    split1Amount: '',
    split2Method: pickAlternativeMethod(fallbackPrimaryMethod),
    isMixedPayment: false,
  };
}
