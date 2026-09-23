export type PaymentMethod =
  | 'pago_movil'
  | 'efectivo'
  | 'punto_venta'
  | 'divisa';

/**
 * Discriminates a split row's role in the payment record:
 * - `payment` (default when absent, for compatibility with rows written
 *   before this field existed): money received.
 * - `change`: money returned to the customer (`amountBs` is `<= 0`).
 *
 * Kept optional and defaulting to `'payment'` so every pre-existing split
 * and every Expenses record (which never writes `kind`) keeps working
 * unchanged. See `resolveSplitKind`/`isChangeSplit`.
 */
export type PaymentSplitKind = 'payment' | 'change';

export interface PaymentSplit {
  method: PaymentMethod;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  kind?: PaymentSplitKind;
}

export function resolveSplitKind(
  split: Pick<PaymentSplit, 'kind'>
): PaymentSplitKind {
  return split.kind ?? 'payment';
}

/**
 * True when a split represents change handed back to the customer.
 * Prefers the explicit `kind`; falls back to the sign of `amountBs` for
 * rows written between the DB migration and a full client rollout (or
 * replayed from an offline queue) that predate this field.
 */
export function isChangeSplit(
  split: Pick<PaymentSplit, 'kind' | 'amountBs'>
): boolean {
  if (split.kind !== undefined) {
    return split.kind === 'change';
  }
  return split.amountBs < 0;
}

export interface SplitPaymentCompatible {
  paymentMethod: PaymentMethod;
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

/**
 * Feature gate for the divisa change ("vuelto") flow. Deliberately scoped to
 * water and rentals only — Expenses is out of scope for this feature.
 */
export type DivisaChangeFeatureFlags = Pick<
  MixedPaymentFeatureFlags,
  'enabled' | 'water' | 'rentals'
>;

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

export type PaymentBalanceTransactionUpdate =
  Partial<PaymentBalanceTransactionDraft>;

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
