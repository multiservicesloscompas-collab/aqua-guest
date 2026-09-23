import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import {
  evaluateCashTender,
  evaluateChangeBreakdown,
  type UsdBillCounts,
} from '@aqua-guest/domain';
import { roundToCurrency } from './paymentSplitRounding';

export interface DivisaTenderSplitsInput {
  /** Sale/rental total in Bs, INCLUDING tip if any. */
  totalBs: number;
  exchangeRate: number;
  tenderedBills: UsdBillCounts;
  changeBills: UsdBillCounts;
  /** Bs-denominated method that covers the remainder of the change, or a shortfall. */
  remainderMethod: PaymentMethod;
  /** Required only when the tender falls short of the total. */
  complementMethod?: PaymentMethod;
}

function buildPaymentSplit(
  method: PaymentMethod,
  amountBs: number,
  amountUsd: number,
  exchangeRate: number
): PaymentSplit {
  return {
    method,
    amountBs: roundToCurrency(amountBs),
    amountUsd: roundToCurrency(amountUsd),
    exchangeRateUsed: exchangeRate,
    kind: 'payment',
  };
}

function buildChangeSplit(
  method: PaymentMethod,
  amountBs: number,
  amountUsd: number,
  exchangeRate: number
): PaymentSplit {
  return {
    method,
    amountBs: roundToCurrency(amountBs),
    amountUsd: roundToCurrency(amountUsd),
    exchangeRateUsed: exchangeRate,
    kind: 'change',
  };
}

/**
 * Builds the payment splits for a divisa (USD bill) payment: the bills
 * tendered, plus — when they exceed the total — the change given back,
 * split between USD bills and a Bs remainder. When the bills fall short of
 * the total, this degrades to an ordinary two-method mixed payment (both
 * legs positive, no change rows): overpayment and underpayment are the
 * same operation with opposite sign.
 */
export function buildDivisaTenderSplits(
  input: DivisaTenderSplitsInput
): PaymentSplit[] {
  if (input.remainderMethod === 'divisa') {
    throw new Error('El método del resto no puede ser divisa.');
  }
  if (input.complementMethod === 'divisa') {
    throw new Error('El método complementario no puede ser divisa.');
  }

  const tender = evaluateCashTender({
    totalBs: input.totalBs,
    exchangeRate: input.exchangeRate,
    tenderedBills: input.tenderedBills,
  });

  const tenderedSplit = buildPaymentSplit(
    'divisa',
    tender.tenderedBs,
    tender.tenderedUsd,
    input.exchangeRate
  );

  if (tender.status === 'exact') {
    return [tenderedSplit];
  }

  if (tender.status === 'short') {
    if (!input.complementMethod) {
      throw new Error(
        'Falta el método que cubre el faltante del pago en divisa.'
      );
    }

    const shortfallBs = roundToCurrency(input.totalBs - tender.tenderedBs);
    const shortfallUsd =
      input.exchangeRate > 0 ? shortfallBs / input.exchangeRate : 0;

    return [
      tenderedSplit,
      buildPaymentSplit(
        input.complementMethod,
        shortfallBs,
        shortfallUsd,
        input.exchangeRate
      ),
    ];
  }

  const changeDueBs = tender.differenceBs;
  const breakdown = evaluateChangeBreakdown({
    changeDueBs,
    exchangeRate: input.exchangeRate,
    usdBills: input.changeBills,
  });

  const splits: PaymentSplit[] = [tenderedSplit];

  if (breakdown.changeUsd > 0) {
    splits.push(
      buildChangeSplit(
        'divisa',
        -breakdown.changeUsdBs,
        -breakdown.changeUsd,
        input.exchangeRate
      )
    );
  }

  if (breakdown.remainderBs > 0) {
    const remainderUsd =
      input.exchangeRate > 0 ? breakdown.remainderBs / input.exchangeRate : 0;
    splits.push(
      buildChangeSplit(
        input.remainderMethod,
        -breakdown.remainderBs,
        -remainderUsd,
        input.exchangeRate
      )
    );
  }

  return splits;
}
