import type { PaymentMethod } from './payment-method';

export interface PaymentSplit {
  method: PaymentMethod;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
}

export interface SplitPaymentCompatible {
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
}

export type SplitAware<T extends SplitPaymentCompatible> = T & {
  paymentSplits?: PaymentSplit[];
};

export type PaymentSplitModule = 'water' | 'rentals' | 'expenses';

export interface MixedPaymentFeatureFlags {
  enabled: boolean;
  water: boolean;
  rentals: boolean;
  expenses: boolean;
}
