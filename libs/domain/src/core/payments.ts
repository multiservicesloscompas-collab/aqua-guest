export type PaymentMethod =
  | 'pago_movil'
  | 'efectivo'
  | 'punto_venta'
  | 'divisa';

export type PaymentMethodForSplit = PaymentMethod;

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

export type SplitAware<T extends SplitPaymentCompatible> = Omit<
  T,
  'paymentSplits'
> & {
  paymentSplits?: PaymentSplit[];
};

export type PaymentSplitModule = 'water' | 'rentals' | 'expenses';

export interface MixedPaymentFeatureFlags {
  enabled: boolean;
  water: boolean;
  rentals: boolean;
  expenses: boolean;
}

export interface PaymentBalanceTransaction {
  id: string;
  date: string;
  operationType?: 'equilibrio' | 'avance';
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

export type PaymentBalanceOperationType = NonNullable<
  PaymentBalanceTransaction['operationType']
>;

export type PaymentBalanceTransactionDraft = Omit<
  PaymentBalanceTransaction,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PaymentBalanceTransactionUpdate = Partial<
  PaymentBalanceTransactionDraft
>;

export type NormalizedPaymentBalanceAmounts = Required<
  Pick<
    PaymentBalanceTransaction,
    | 'operationType'
    | 'amount'
    | 'amountBs'
    | 'amountOutBs'
    | 'amountInBs'
    | 'differenceBs'
  >
> &
  Pick<
    PaymentBalanceTransaction,
    'amountUsd' | 'amountOutUsd' | 'amountInUsd' | 'differenceUsd'
  >;

export interface PaymentBalanceSummary {
  method: PaymentMethod;
  originalTotal: number;
  adjustments: number;
  finalTotal: number;
}
