import type { PaymentMethod } from '@/types';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { deriveLegacyPaymentMethodFromSplits } from '@/services/payments/paymentSplitCompatibility';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';

interface ResolveExpensePaymentSubmitInput {
  enableMixedPaymentFeature: boolean;
  isMixedPayment: boolean;
  paymentMethod: PaymentMethod;
  secondaryMethod: PaymentMethod;
  mixedAmountInput: string;
  parsedAmount: number;
  exchangeRate: number;
}

export function resolveExpensePaymentSubmit({
  enableMixedPaymentFeature,
  isMixedPayment,
  paymentMethod,
  secondaryMethod,
  mixedAmountInput,
  parsedAmount,
  exchangeRate,
}: ResolveExpensePaymentSubmitInput) {
  const basePaymentSplits = enableMixedPaymentFeature
    ? buildDualPaymentSplits({
        enableMixedPayment: isMixedPayment,
        primaryMethod: paymentMethod,
        secondaryMethod,
        amountInput: mixedAmountInput,
        amountInputMode: 'secondary',
        totalBs: parsedAmount,
        totalUsd: parsedAmount / exchangeRate,
        exchangeRate,
      })
    : undefined;

  const normalizedSplits =
    isMixedPayment && basePaymentSplits
      ? normalizeAndValidatePaymentSplits({
          splits: basePaymentSplits,
          totalBs: parsedAmount,
          totalUsd: parsedAmount / exchangeRate,
        })
      : null;

  if (normalizedSplits && !normalizedSplits.validation.ok) {
    return {
      errorMessage: normalizedSplits.validation.errors[0],
      paymentMethod,
      paymentSplits: basePaymentSplits,
    };
  }

  const paymentSplits = normalizedSplits?.splits ?? basePaymentSplits;

  const methodToSave =
    isMixedPayment && paymentSplits && paymentSplits.length > 0
      ? deriveLegacyPaymentMethodFromSplits(paymentSplits, paymentMethod)
      : paymentMethod;

  return {
    errorMessage: null,
    paymentMethod: methodToSave,
    paymentSplits,
  };
}
