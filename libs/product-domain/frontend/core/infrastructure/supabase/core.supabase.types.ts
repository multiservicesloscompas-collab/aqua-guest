import type {
  ExchangeRateHistory,
  Expense,
  PaymentBalanceTransaction,
  Tip,
} from '@aqua-guest/domain';
import type {
  PaymentSplitInsertRow,
  PaymentSplitRow,
} from '../../../shared/infrastructure/supabase';

type NumericLike<T extends number | undefined> = T | string;

export const EXPENSE_PAYMENT_SPLITS_TABLE = 'expense_payment_splits';

export type ExpensePaymentSplitInsertRow = PaymentSplitInsertRow<'expense_id'>;

export interface ExchangeRateRow extends Pick<ExchangeRateHistory, 'date'> {
  rate: NumericLike<ExchangeRateHistory['rate']>;
  updatedAt?: ExchangeRateHistory['updatedAt'] | null;
}

export interface ExpenseRow
  extends Pick<Expense, 'id' | 'date' | 'description' | 'category'> {
  amount: NumericLike<Expense['amount']>;
  paymentMethod?: Expense['paymentMethod'] | null;
  paymentSplits?: PaymentSplitRow[] | null;
  notes?: Expense['notes'] | null;
  createdAt?: Expense['createdAt'] | null;
}

export interface PaymentBalanceTransactionRow
  extends Pick<PaymentBalanceTransaction, 'id' | 'date'> {
  operationType?: PaymentBalanceTransaction['operationType'] | null;
  fromMethod: PaymentBalanceTransaction['fromMethod'];
  toMethod: PaymentBalanceTransaction['toMethod'];
  amount: NumericLike<PaymentBalanceTransaction['amount']>;
  amountBs?: NumericLike<PaymentBalanceTransaction['amountBs']> | null;
  amountUsd?: NumericLike<PaymentBalanceTransaction['amountUsd']> | null;
  amountOutBs?: NumericLike<PaymentBalanceTransaction['amountOutBs']> | null;
  amountOutUsd?: NumericLike<PaymentBalanceTransaction['amountOutUsd']> | null;
  amountInBs?: NumericLike<PaymentBalanceTransaction['amountInBs']> | null;
  amountInUsd?: NumericLike<PaymentBalanceTransaction['amountInUsd']> | null;
  differenceBs?: NumericLike<PaymentBalanceTransaction['differenceBs']> | null;
  differenceUsd?: NumericLike<PaymentBalanceTransaction['differenceUsd']> | null;
  notes?: PaymentBalanceTransaction['notes'] | null;
  createdAt?: PaymentBalanceTransaction['createdAt'] | null;
  updatedAt?: PaymentBalanceTransaction['updatedAt'] | null;
}

export interface TipRow extends Pick<Tip, 'id' | 'originType' | 'originId' | 'tipDate'> {
  amountBs: NumericLike<Tip['amountBs']>;
  amountUsd?: NumericLike<Tip['amountUsd']> | null;
  exchangeRateUsed?: NumericLike<Tip['exchangeRateUsed']> | null;
  capturePaymentMethod: Tip['capturePaymentMethod'];
  status: Tip['status'];
  paidPaymentMethod?: Tip['paidPaymentMethod'] | null;
  paidAt?: Tip['paidAt'] | null;
  notes?: Tip['notes'] | null;
  createdAt?: Tip['createdAt'] | null;
  updatedAt?: Tip['updatedAt'] | null;
  origin_type?: Tip['originType'];
  origin_id?: string;
  tip_date?: Tip['tipDate'];
  amount_bs?: NumericLike<Tip['amountBs']>;
  amount_usd?: NumericLike<Tip['amountUsd']> | null;
  exchange_rate_used?: NumericLike<Tip['exchangeRateUsed']> | null;
  capture_payment_method?: Tip['capturePaymentMethod'];
  paid_payment_method?: Tip['paidPaymentMethod'] | null;
  paid_at?: Tip['paidAt'] | null;
  created_at?: Tip['createdAt'] | null;
  updated_at?: Tip['updatedAt'] | null;
}

export interface TipAmountRow extends Pick<TipRow, 'amountBs'> {
  tipDate?: Tip['tipDate'];
  amount_bs?: NumericLike<Tip['amountBs']>;
  tip_date?: Tip['tipDate'];
}

export const toExpensePaymentSplitInsertRows = (
  expenseId: string,
  splits: Readonly<NonNullable<Expense['paymentSplits']>>
): ExpensePaymentSplitInsertRow[] =>
  splits.map((split) => ({
    expense_id: expenseId,
    payment_method: split.method,
    amount_bs: split.amountBs,
    amount_usd: split.amountUsd,
    exchange_rate_used: split.exchangeRateUsed,
  }));
