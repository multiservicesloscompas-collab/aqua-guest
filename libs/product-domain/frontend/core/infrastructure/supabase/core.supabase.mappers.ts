import type {
  ExchangeRateHistory,
  Expense,
  ExpenseDraft,
  ExpenseUpdate,
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
  Tip,
} from '@aqua-guest/domain';
import { fromPaymentSplitRows } from '../../../shared/infrastructure/supabase';
import type {
  ExchangeRateRow,
  ExpenseRow,
  PaymentBalanceTransactionRow,
  TipRow,
} from './core.supabase.types';

const getSafeTimestamp = () => new Date().toISOString();

const normalizeTimestamp = (value: string | null | undefined, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

export const toExchangeRateHistory = (row: ExchangeRateRow): ExchangeRateHistory => ({
  date: row.date,
  rate: Number(row.rate),
  updatedAt: normalizeTimestamp(row.updatedAt, getSafeTimestamp()),
});

export const toExchangeRatePayload = (
  input: Partial<ExchangeRateHistory>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.date !== undefined) payload.date = input.date;
  if (input.rate !== undefined) payload.rate = input.rate;
  if (input.updatedAt !== undefined) payload.updated_at = input.updatedAt;

  return payload;
};

export const toExpense = (row: ExpenseRow): Expense => {
  const paymentSplits = fromPaymentSplitRows(row.paymentSplits ?? []);

  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.paymentMethod ?? 'efectivo',
    paymentSplits: paymentSplits.length > 0 ? paymentSplits : undefined,
    notes: row.notes ?? undefined,
    createdAt: normalizeTimestamp(row.createdAt, getSafeTimestamp()),
  };
};

export const toExpenseCreatePayload = (
  input: ExpenseDraft
): Record<string, unknown> => ({
  date: input.date,
  description: input.description,
  amount: input.amount,
  category: input.category,
  payment_method: input.paymentMethod,
  notes: input.notes,
});

export const toExpenseUpdatePayload = (
  input: ExpenseUpdate
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.date !== undefined) payload.date = input.date;
  if (input.description !== undefined) payload.description = input.description;
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.category !== undefined) payload.category = input.category;
  if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
};

export const toPaymentBalanceTransaction = (
  row: PaymentBalanceTransactionRow
): PaymentBalanceTransaction => {
  const amount = Number(row.amount);
  const amountBs = row.amountBs == null ? amount : Number(row.amountBs);
  const amountOutBs = row.amountOutBs == null ? amountBs : Number(row.amountOutBs);
  const amountInBs = row.amountInBs == null ? amountBs : Number(row.amountInBs);

  return {
    id: row.id,
    date: row.date,
    operationType: row.operationType ?? 'equilibrio',
    fromMethod: row.fromMethod,
    toMethod: row.toMethod,
    amount,
    amountBs,
    amountUsd: row.amountUsd == null ? undefined : Number(row.amountUsd),
    amountOutBs,
    amountOutUsd: row.amountOutUsd == null ? undefined : Number(row.amountOutUsd),
    amountInBs,
    amountInUsd: row.amountInUsd == null ? undefined : Number(row.amountInUsd),
    differenceBs: row.differenceBs == null ? amountInBs - amountOutBs : Number(row.differenceBs),
    differenceUsd: row.differenceUsd == null ? undefined : Number(row.differenceUsd),
    notes: row.notes ?? undefined,
    createdAt: normalizeTimestamp(row.createdAt, getSafeTimestamp()),
    updatedAt: normalizeTimestamp(row.updatedAt, getSafeTimestamp()),
  };
};

export const toPaymentBalanceCreatePayload = (
  input: PaymentBalanceTransactionDraft
): Record<string, unknown> => ({
  date: input.date,
  operation_type: input.operationType,
  from_method: input.fromMethod,
  to_method: input.toMethod,
  amount: input.amount,
  amount_bs: input.amountBs,
  amount_usd: input.amountUsd,
  amount_out_bs: input.amountOutBs,
  amount_out_usd: input.amountOutUsd,
  amount_in_bs: input.amountInBs,
  amount_in_usd: input.amountInUsd,
  difference_bs: input.differenceBs,
  difference_usd: input.differenceUsd,
  notes: input.notes,
});

export const toPaymentBalanceUpdatePayload = (
  input: PaymentBalanceTransactionUpdate
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    updated_at: getSafeTimestamp(),
  };

  if (input.date !== undefined) payload.date = input.date;
  if (input.operationType !== undefined) payload.operation_type = input.operationType;
  if (input.fromMethod !== undefined) payload.from_method = input.fromMethod;
  if (input.toMethod !== undefined) payload.to_method = input.toMethod;
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.amountBs !== undefined) payload.amount_bs = input.amountBs;
  if (input.amountUsd !== undefined) payload.amount_usd = input.amountUsd;
  if (input.amountOutBs !== undefined) payload.amount_out_bs = input.amountOutBs;
  if (input.amountOutUsd !== undefined) payload.amount_out_usd = input.amountOutUsd;
  if (input.amountInBs !== undefined) payload.amount_in_bs = input.amountInBs;
  if (input.amountInUsd !== undefined) payload.amount_in_usd = input.amountInUsd;
  if (input.differenceBs !== undefined) payload.difference_bs = input.differenceBs;
  if (input.differenceUsd !== undefined) payload.difference_usd = input.differenceUsd;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
};

export const toTip = (row: TipRow): Tip => ({
  id: row.id,
  originType: row.originType ?? row.origin_type,
  originId: row.originId ?? row.origin_id ?? '',
  tipDate: row.tipDate ?? row.tip_date ?? '',
  amountBs: Number(row.amountBs ?? row.amount_bs ?? 0),
  amountUsd:
    row.amountUsd == null
      ? row.amount_usd == null
        ? undefined
        : Number(row.amount_usd)
      : Number(row.amountUsd),
  exchangeRateUsed:
    row.exchangeRateUsed == null
      ? row.exchange_rate_used == null
        ? undefined
        : Number(row.exchange_rate_used)
      : Number(row.exchangeRateUsed),
  capturePaymentMethod:
    row.capturePaymentMethod ?? row.capture_payment_method ?? 'efectivo',
  status: row.status,
  paidPaymentMethod: row.paidPaymentMethod ?? row.paid_payment_method ?? undefined,
  paidAt: row.paidAt ?? row.paid_at ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: normalizeTimestamp(row.createdAt ?? row.created_at ?? undefined, getSafeTimestamp()),
  updatedAt: normalizeTimestamp(row.updatedAt ?? row.updated_at ?? undefined, getSafeTimestamp()),
});

export const toTipUpsertPayload = (input: {
  originType: Tip['originType'];
  originId: Tip['originId'];
  tipDate: Tip['tipDate'];
  amountBs: Tip['amountBs'];
  amountUsd?: Tip['amountUsd'];
  exchangeRateUsed?: Tip['exchangeRateUsed'];
  capturePaymentMethod: Tip['capturePaymentMethod'];
  notes?: Tip['notes'];
}): Record<string, unknown> => ({
  origin_type: input.originType,
  origin_id: input.originId,
  tip_date: input.tipDate,
  amount_bs: input.amountBs,
  amount_usd: input.amountUsd,
  exchange_rate_used: input.exchangeRateUsed,
  capture_payment_method: input.capturePaymentMethod,
  notes: input.notes,
});

export const toTipUpdatePayload = (
  input: Partial<{
    originType: Tip['originType'];
    originId: Tip['originId'];
    tipDate: Tip['tipDate'];
    amountBs: Tip['amountBs'];
    amountUsd?: Tip['amountUsd'];
    exchangeRateUsed?: Tip['exchangeRateUsed'];
    capturePaymentMethod: Tip['capturePaymentMethod'];
    notes?: Tip['notes'];
  }>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.originType !== undefined) payload.origin_type = input.originType;
  if (input.originId !== undefined) payload.origin_id = input.originId;
  if (input.tipDate !== undefined) payload.tip_date = input.tipDate;
  if (input.amountBs !== undefined) payload.amount_bs = input.amountBs;
  if (input.amountUsd !== undefined) payload.amount_usd = input.amountUsd;
  if (input.exchangeRateUsed !== undefined)
    payload.exchange_rate_used = input.exchangeRateUsed;
  if (input.capturePaymentMethod !== undefined)
    payload.capture_payment_method = input.capturePaymentMethod;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
};
