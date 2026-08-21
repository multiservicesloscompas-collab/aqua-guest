import type {
  PaymentMethod,
  Tip,
  TipOriginType,
} from '@aqua-guest/domain';
import type {
  TipDailyPayoutRequest,
  TipPayoutSummary,
  TipSinglePayoutRequest,
  TipUpsertInput,
} from '@aqua-guest/product-domain/frontend';

export type { TipOriginType };

export type { Tip, TipDailyPayoutRequest, TipPayoutSummary, TipSinglePayoutRequest, TipUpsertInput };

export type TipStatus = Tip['status'];

export interface TipPayout {
  id: string;
  tipDate: string;
  paidAt: string;
  paymentMethod: PaymentMethod;
  amountBs: number;
  originType: TipOriginType;
  originId: string;
}

export interface TipCaptureInput {
  amountBs: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
}
