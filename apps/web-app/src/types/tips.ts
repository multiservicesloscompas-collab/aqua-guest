import type {
  PaymentMethod,
  Tip,
  TipOriginReference,
  TipOriginType,
  TipStatus,
} from '@aqua-guest/domain';

export type { Tip, TipOriginType, TipStatus };

export type TipPayout = TipOriginReference &
  Pick<Tip, 'id' | 'tipDate' | 'amountBs'> & {
    paidAt: string;
    paymentMethod: PaymentMethod;
  };

export interface TipPayoutSummary {
  date: string;
  paymentMethod: PaymentMethod;
  paidCount: number;
  totalAmountBs: number;
}

export type TipUpsertInput = TipOriginReference &
  Pick<
    Tip,
    | 'tipDate'
    | 'amountBs'
    | 'amountUsd'
    | 'exchangeRateUsed'
    | 'capturePaymentMethod'
    | 'notes'
  >;

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

export type TipCaptureInput = Pick<
  Tip,
  'amountBs' | 'capturePaymentMethod' | 'notes'
>;
