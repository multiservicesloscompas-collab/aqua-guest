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
