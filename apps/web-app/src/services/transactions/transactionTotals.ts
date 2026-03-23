import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
interface FinalSaleTotalsInput {
  principalBs: number;
  exchangeRate: number;
  tipAmountBs?: number;
}

interface FinalRentalTotalsInput {
  principalUsd: number;
  exchangeRate: number;
  tipAmountBs?: number;
}

export interface FinalSaleTotals {
  principalBs: number;
  tipAmountBs: number;
  totalBs: number;
  totalUsd: number;
}

export interface FinalRentalTotals {
  principalUsd: number;
  tipAmountBs: number;
  totalUsd: number;
}

function toSafePositiveAmount(value: number | undefined): number {
  if (!value || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value;
}

export function calculateFinalSaleTotals(
  input: FinalSaleTotalsInput
): FinalSaleTotals {
  const principalBs = toSafePositiveAmount(input.principalBs);
  const tipAmountBs = toSafePositiveAmount(input.tipAmountBs);
  const totalBs = principalBs + tipAmountBs;
  const totalUsd = input.exchangeRate > 0 ? totalBs / input.exchangeRate : 0;

  return {
    principalBs,
    tipAmountBs,
    totalBs,
    totalUsd,
  };
}

export function calculateFinalRentalTotals(
  input: FinalRentalTotalsInput
): FinalRentalTotals {
  const principalUsd = toSafePositiveAmount(input.principalUsd);
  const tipAmountBs = toSafePositiveAmount(input.tipAmountBs);
  const tipUsd = input.exchangeRate > 0 ? tipAmountBs / input.exchangeRate : 0;

  return {
    principalUsd,
    tipAmountBs,
    totalUsd: principalUsd + tipUsd,
  };
}

export function deriveSaleTipAmountBs(
  totalBs: number,
  principalBs: number
): number {
  return Math.max(
    0,
    toSafePositiveAmount(totalBs) - toSafePositiveAmount(principalBs)
  );
}

export function deriveRentalTipAmountBs(
  totalUsd: number,
  principalUsd: number,
  exchangeRate: number
): number {
  if (!(exchangeRate > 0)) {
    return 0;
  }

  const tipUsd = Math.max(
    0,
    toSafePositiveAmount(totalUsd) - toSafePositiveAmount(principalUsd)
  );
  return tipUsd * exchangeRate;
}

interface MergeTipIntoPaymentSplitsInput {
  paymentSplits: PaymentSplit[] | undefined;
  fallbackMethod: PaymentMethod;
  tipAmountBs: number;
  tipPaymentMethod: PaymentMethod;
  exchangeRate: number;
  principalBs?: number; // Added for Water Sales
  principalUsd?: number; // Added for Rentals (one of these should be provided)
}

export function mergeTipIntoPaymentSplits(
  input: MergeTipIntoPaymentSplitsInput
): PaymentSplit[] {
  const safeTipBs = toSafePositiveAmount(input.tipAmountBs);

  if (!(safeTipBs > 0)) {
    return input.paymentSplits ?? [];
  }

  const tipAmountUsd =
    input.exchangeRate > 0 ? safeTipBs / input.exchangeRate : undefined;

  // Initialize base from existing splits OR create a default one with the principal amount
  const base: PaymentSplit[] =
    input.paymentSplits && input.paymentSplits.length > 0
      ? input.paymentSplits.map((split) => ({ ...split }))
      : [
          {
            method: input.fallbackMethod,
            amountBs: input.principalBs ?? 0,
            amountUsd: input.principalUsd ?? 0,
            exchangeRateUsed: input.exchangeRate,
          },
        ];

  // If we initialized with principalUsd, ensure we have amountBs for internal logic if needed
  // But usually, amountBs is the primary key for splitting in this app.
  if (
    input.principalUsd &&
    input.principalUsd > 0 &&
    base[0].amountBs === 0 &&
    input.exchangeRate > 0
  ) {
    base[0].amountBs = input.principalUsd * input.exchangeRate;
  }

  const current = base.find((split) => split.method === input.tipPaymentMethod);

  if (current) {
    current.amountBs += safeTipBs;
    if (tipAmountUsd !== undefined) {
      current.amountUsd = (current.amountUsd ?? 0) + tipAmountUsd;
    }
    if (!current.exchangeRateUsed && input.exchangeRate > 0) {
      current.exchangeRateUsed = input.exchangeRate;
    }
    return base;
  }

  return [
    ...base,
    {
      method: input.tipPaymentMethod,
      amountBs: safeTipBs,
      amountUsd: tipAmountUsd,
      exchangeRateUsed: input.exchangeRate,
    },
  ];
}
