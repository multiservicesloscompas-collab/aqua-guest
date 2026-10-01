import type { PaymentMethod } from './payment-method';

export type PaymentBalanceOperationType = 'equilibrio' | 'avance';

export interface PaymentBalanceTransaction {
  id: string;
  date: string;
  operationType?: PaymentBalanceOperationType;
  fromMethod: PaymentMethod;
  toMethod: PaymentMethod;
  amount: number;
  amountBs?: number;
  amountUsd?: number;
  amountOutBs?: number;
  amountOutUsd?: number;
  amountInBs?: number;
  amountInUsd?: number;
  differenceBs?: number;
  differenceUsd?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentBalanceTransactionDraft = Omit<
  PaymentBalanceTransaction,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PaymentBalanceTransactionUpdate =
  Partial<PaymentBalanceTransaction>;

export interface PaymentBalanceSummary {
  method: PaymentMethod;
  originalTotal: number;
  adjustments: number;
  finalTotal: number;
}
