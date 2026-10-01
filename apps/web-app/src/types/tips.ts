import type {
  PaymentMethod,
  Tip,
  TipCaptureInput,
  TipPayout,
  TipPayoutSummary,
  TipUpsertInput,
  TipOriginType,
  TipStatus,
} from '@aqua-guest/domain';

export type {
  Tip,
  TipCaptureInput,
  TipOriginType,
  TipPayout,
  TipPayoutSummary,
  TipStatus,
  TipUpsertInput,
};

export interface TipDailyPayoutRequest {
  tipDate: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  paidAt?: string;
}

export interface TipSinglePayoutRequest {
  tipId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  paidAt?: string;
  tipDate?: string;
}
