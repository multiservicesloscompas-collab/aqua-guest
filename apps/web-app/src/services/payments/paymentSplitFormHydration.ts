import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import { hasValidMixedPaymentSplits } from './paymentSplitValidity';

interface ResolveSplitFormHydrationInput {
  paymentMethod: PaymentMethod;
  paymentSplits?: readonly PaymentSplit[];
  totalBs: number;
  tipAmountBs?: number;
  tipPaymentMethod?: PaymentMethod;
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
  const { paymentMethod, paymentSplits, tipAmountBs = 0, tipPaymentMethod } = input;

  let processedSplits = paymentSplits ? [...paymentSplits] : undefined;

  if (processedSplits && tipAmountBs > 0 && tipPaymentMethod) {
    processedSplits = processedSplits
      .map((split) => {
        if (split.method === tipPaymentMethod) {
          const nextAmount = Math.max(0, split.amountBs - tipAmountBs);
          return {
            ...split,
            amountBs: nextAmount,
          };
        }
        return split;
      })
      .filter((split) => split.amountBs > 0.01);
  }

  if (hasValidMixedPaymentSplits(processedSplits)) {
    const sortedSplits = sortSplitsByPriority(processedSplits);
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

  const splitsArray = processedSplits as readonly PaymentSplit[] | undefined;
  const fallbackPrimaryMethod = (splitsArray && splitsArray.length > 0)
    ? splitsArray[0].method
    : paymentMethod;

  return {
    paymentMethod: fallbackPrimaryMethod,
    split1Amount: '',
    split2Method: pickAlternativeMethod(fallbackPrimaryMethod),
    isMixedPayment: false,
  };
}
