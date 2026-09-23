import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import { isChangeSplit } from '@aqua-guest/domain';
import {
  hasChangeSplits,
  hasValidMixedPaymentSplits,
} from './paymentSplitValidity';

interface ResolveSplitFormHydrationInput {
  paymentMethod: PaymentMethod;
  paymentSplits?: readonly PaymentSplit[];
  totalBs: number;
  tipAmountBs?: number;
  tipPaymentMethod?: PaymentMethod;
}

/**
 * Read-only summary of a divisa-with-change record for the edit form. Bill
 * counts are NOT persisted (only the resulting amounts), so this cannot be
 * turned back into an editable bill selector — the edit UI must render it
 * read-only with a "Recalcular vuelto" action that opens a fresh tender
 * drawer instead of trying to reconstruct the original bill breakdown.
 */
export interface SplitFormChangeState {
  tenderedUsd: number;
  changeUsd: number;
  remainderBs: number;
  remainderMethod: PaymentMethod | null;
}

export interface SplitFormHydrationState {
  paymentMethod: PaymentMethod;
  split1Amount: string;
  split2Method: PaymentMethod;
  isMixedPayment: boolean;
  changeState?: SplitFormChangeState;
}

function buildChangeState(
  splits: readonly PaymentSplit[]
): SplitFormChangeState {
  const tenderedUsd = splits
    .filter((split) => !isChangeSplit(split))
    .reduce((sum, split) => sum + (split.amountUsd ?? 0), 0);

  const divisaChange = splits.find(
    (split) => isChangeSplit(split) && split.method === 'divisa'
  );
  const remainderSplit = splits.find(
    (split) => isChangeSplit(split) && split.method !== 'divisa'
  );

  return {
    tenderedUsd,
    changeUsd: divisaChange ? Math.abs(divisaChange.amountUsd ?? 0) : 0,
    remainderBs: remainderSplit ? Math.abs(remainderSplit.amountBs) : 0,
    remainderMethod: remainderSplit?.method ?? null,
  };
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

  // Never unwind a tip out of a divisa-with-change record: in change mode
  // the tip was never merged into the splits in the first place (see
  // mergeTipIntoPaymentSplits' own change-splits bypass), and this filter
  // would otherwise strip the negative change legs (amountBs <= 0.01),
  // silently destroying the change record.
  if (
    processedSplits &&
    !hasChangeSplits(processedSplits) &&
    tipAmountBs > 0 &&
    tipPaymentMethod
  ) {
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

  if (processedSplits && hasChangeSplits(processedSplits)) {
    const primaryMethod =
      processedSplits.find((split) => !isChangeSplit(split))?.method ??
      paymentMethod;

    return {
      paymentMethod: primaryMethod,
      split1Amount: '',
      split2Method: pickAlternativeMethod(primaryMethod),
      isMixedPayment: false,
      changeState: buildChangeState(processedSplits),
    };
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
