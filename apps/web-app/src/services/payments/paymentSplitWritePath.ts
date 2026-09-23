import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import {
  deriveLegacyPaymentMethodFromSplits,
  toPaymentSplitsFromLegacy,
} from './paymentSplitCompatibility';
import {
  normalizeAndValidatePaymentSplits,
  type PaymentSplitValidationResult,
} from './paymentSplitValidation';
import {
  preferNonDivisaChangeLeg,
  roundToCurrency,
} from './paymentSplitRounding';
import { hasChangeSplits } from './paymentSplitValidity';

interface PreparePaymentWriteInput {
  paymentMethod: PaymentMethod;
  paymentSplits?: readonly PaymentSplit[];
  totalBs: number;
  totalUsd: number;
  exchangeRate: number;
}

interface PreparePaymentWriteResult {
  paymentMethod: PaymentMethod;
  paymentSplits: PaymentSplit[];
  validation: PaymentSplitValidationResult;
}

interface BuildDualPaymentSplitsInput {
  enableMixedPayment: boolean;
  primaryMethod: PaymentMethod;
  secondaryMethod: PaymentMethod;
  amountInput?: string | number;
  amountInputMode?: 'primary' | 'secondary';
  totalBs: number;
  totalUsd: number;
  exchangeRate: number;
}

function enrichSplits(
  splits: readonly PaymentSplit[],
  exchangeRate: number
): PaymentSplit[] {
  return splits
    .filter((split) => split.amountBs !== 0)
    .map((split) => ({
      ...split,
      amountUsd:
        split.amountUsd ??
        roundToCurrency(exchangeRate > 0 ? split.amountBs / exchangeRate : 0),
      exchangeRateUsed: split.exchangeRateUsed ?? exchangeRate,
    }));
}

export function preparePaymentWritePayload(
  input: PreparePaymentWriteInput
): PreparePaymentWriteResult {
  const baseSplits =
    input.paymentSplits && input.paymentSplits.length
      ? input.paymentSplits
      : toPaymentSplitsFromLegacy(
          input.paymentMethod,
          input.totalBs,
          input.totalUsd,
          input.exchangeRate
        );

  const enrichedSplits = enrichSplits(baseSplits, input.exchangeRate);

  // A divisa-with-change payload carries a change leg (negative amountBs);
  // any rounding residual must land there instead of on the physically
  // exact tendered leg. Every other payload (the vast majority) has no
  // change split, so this is a no-op and behavior is unchanged.
  const residualTarget = hasChangeSplits(enrichedSplits)
    ? preferNonDivisaChangeLeg
    : undefined;

  const { splits, validation } = normalizeAndValidatePaymentSplits({
    splits: enrichedSplits,
    totalBs: input.totalBs,
    totalUsd: input.totalUsd,
    residualTarget,
  });

  if (!validation.ok) {
    throw new Error(validation.errors[0]);
  }

  return {
    paymentMethod: deriveLegacyPaymentMethodFromSplits(
      splits,
      input.paymentMethod
    ),
    paymentSplits: splits,
    validation,
  };
}

export function buildDualPaymentSplits(
  input: BuildDualPaymentSplitsInput
): PaymentSplit[] {
  const {
    enableMixedPayment,
    primaryMethod,
    secondaryMethod,
    amountInput,
    amountInputMode = 'primary',
    totalBs,
    totalUsd,
    exchangeRate,
  } = input;

  if (!enableMixedPayment) {
    return [
      {
        method: primaryMethod,
        amountBs: totalBs,
        amountUsd: totalUsd,
        exchangeRateUsed: exchangeRate,
      },
    ];
  }

  const rawAmountInput =
    amountInput === '' || amountInput === undefined
      ? Number.NaN
      : Number(amountInput);

  if (Number.isNaN(rawAmountInput)) {
    return [
      {
        method: primaryMethod,
        amountBs: totalBs,
        amountUsd: totalUsd,
        exchangeRateUsed: exchangeRate,
      },
    ];
  }

  const normalizedInputAmount = Math.min(
    Math.max(0, roundToCurrency(rawAmountInput)),
    roundToCurrency(totalBs)
  );
  const normalizedPrimaryAmount =
    amountInputMode === 'secondary'
      ? roundToCurrency(totalBs - normalizedInputAmount)
      : normalizedInputAmount;
  const secondaryAmount = roundToCurrency(totalBs - normalizedPrimaryAmount);

  return [
    {
      method: primaryMethod,
      amountBs: normalizedPrimaryAmount,
      amountUsd: roundToCurrency(
        exchangeRate > 0 ? normalizedPrimaryAmount / exchangeRate : 0
      ),
      exchangeRateUsed: exchangeRate,
    },
    {
      method: secondaryMethod,
      amountBs: secondaryAmount,
      amountUsd: roundToCurrency(
        exchangeRate > 0 ? secondaryAmount / exchangeRate : 0
      ),
      exchangeRateUsed: exchangeRate,
    },
  ].filter((split) => split.amountBs > 0);
}
