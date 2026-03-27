import type { PaymentMethod } from './index';

export type TipOriginType = 'sale' | 'rental';

export type TipStatus = 'pending' | 'paid';

export interface Tip {
  id: string;
  originType: TipOriginType;
  originId: string;
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

export interface TipPayout {
  id: string;
  tipDate: string;
  paidAt: string;
  paymentMethod: PaymentMethod;
  amountBs: number;
  originType: TipOriginType;
  originId: string;
}

export interface TipPayoutSummary {
  date: string;
  paymentMethod: PaymentMethod;
  paidCount: number;
  totalAmountBs: number;
}

export interface TipUpsertInput {
  originType: TipOriginType;
  originId: string;
  tipDate: string;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
}

export interface TipDailyPayoutRequest {
  tipDate: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface TipSinglePayoutRequest {
  tipId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface TipCaptureInput {
  amountBs: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
}
