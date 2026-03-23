export type PaymentMethodForSplit =
  | 'pago_movil'
  | 'efectivo'
  | 'punto_venta'
  | 'divisa';

export interface PaymentSplit {
  method: PaymentMethodForSplit;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
}

export interface SplitPaymentCompatible {
  paymentMethod: PaymentMethodForSplit;
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
