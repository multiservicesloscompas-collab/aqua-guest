import type { PaymentMethod } from '../payments';

export type TipOriginType = 'sale' | 'rental';

export type TipStatus = 'pending' | 'paid';

export interface TipOriginReference {
  originType: TipOriginType;
  originId: string;
}

export interface Tip extends TipOriginReference {
  id: string;
  tipDate: string;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  capturePaymentMethod: PaymentMethod;
  status: TipStatus;
  paidPaymentMethod?: PaymentMethod;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

export type TipCaptureInput = Pick<
  Tip,
  'amountBs' | 'capturePaymentMethod' | 'notes'
>;
