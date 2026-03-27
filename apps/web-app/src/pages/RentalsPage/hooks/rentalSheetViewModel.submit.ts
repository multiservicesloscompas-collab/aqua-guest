import { toast } from 'sonner';
import type { PaymentMethod, WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import type { TipCaptureInput } from '@/types/tips';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';

interface SubmitRentalInput {
  paymentSplits: PaymentSplit[];
  paymentMethod: PaymentMethod;
  tipAmountBs: number;
  tipPaymentMethod: PaymentMethod;
  exchangeRate: number;
  totalBs: number;
  totalUsd: number;
  rentalPayload: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>;
  tipInput?: TipCaptureInput;
  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>,
    tipInput?: TipCaptureInput
  ) => Promise<WasherRental>;
}

export async function submitRental(params: SubmitRentalInput) {
  const splitValidation = normalizeAndValidatePaymentSplits({
    splits: params.paymentSplits,
    totalBs: params.totalBs,
    totalUsd: params.totalUsd,
  });

  if (!splitValidation.validation.ok) {
    toast.error(splitValidation.validation.errors[0]);
    return;
  }

  await params.addRental(
    {
      ...params.rentalPayload,
      paymentSplits: splitValidation.splits,
    },
    params.tipInput
  );
}
