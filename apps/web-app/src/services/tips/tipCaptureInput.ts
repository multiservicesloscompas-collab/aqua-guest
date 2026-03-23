import type { PaymentMethod } from '@/types';
import type { TipCaptureInput } from '@/types/tips';

interface TipInputBuildParams {
  enabled: boolean;
  amount: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export function buildTipCaptureInput(
  params: TipInputBuildParams
): TipCaptureInput | undefined {
  if (!params.enabled) {
    return undefined;
  }

  const amountBs = Number(params.amount);
  if (!(amountBs > 0)) {
    return undefined;
  }

  return {
    amountBs,
    capturePaymentMethod: params.paymentMethod,
    notes: params.notes.trim() || undefined,
  };
}
