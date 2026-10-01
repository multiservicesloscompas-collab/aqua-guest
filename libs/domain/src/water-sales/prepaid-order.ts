import type { PaymentMethod } from '../payments';

export type PrepaidStatus = 'pendiente' | 'entregado';

export interface PrepaidOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  liters: number;
  amountBs: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: PrepaidStatus;
  datePaid: string;
  dateDelivered?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PrepaidOrderDraft = Omit<
  PrepaidOrder,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PrepaidOrderUpdate = Partial<PrepaidOrder>;
