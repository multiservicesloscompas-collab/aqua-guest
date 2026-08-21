import type { PaymentSplit } from '@aqua-guest/domain';

type NumericLike<T extends number | undefined> = T | string;

export const PAYMENT_SPLIT_READ_SELECT =
  'method:payment_method, amountBs:amount_bs, amountUsd:amount_usd, exchangeRateUsed:exchange_rate_used';

export interface PaymentSplitRow
  extends Omit<PaymentSplit, 'amountBs' | 'amountUsd' | 'exchangeRateUsed'> {
  id?: string;
  method: PaymentSplit['method'];
  amountBs: NumericLike<PaymentSplit['amountBs']>;
  amountUsd?: NumericLike<PaymentSplit['amountUsd']> | null;
  exchangeRateUsed?: NumericLike<PaymentSplit['exchangeRateUsed']> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  payment_method?: PaymentSplit['method'];
  amount_bs?: NumericLike<PaymentSplit['amountBs']>;
  amount_usd?: NumericLike<PaymentSplit['amountUsd']> | null;
  exchange_rate_used?: NumericLike<PaymentSplit['exchangeRateUsed']> | null;
}

export type PaymentSplitInsertRow<TParentKey extends string> = {
  [K in TParentKey]: string;
} & {
  payment_method: PaymentSplit['method'];
  amount_bs: PaymentSplit['amountBs'];
  amount_usd?: PaymentSplit['amountUsd'];
  exchange_rate_used?: PaymentSplit['exchangeRateUsed'];
};

export const toPaymentSplitInsertRows = <TParentKey extends string>(
  parentKey: TParentKey,
  parentId: string,
  splits: readonly PaymentSplit[]
): PaymentSplitInsertRow<TParentKey>[] =>
  splits.map((split) => {
    const parent = { [parentKey]: parentId } as Record<TParentKey, string>;

    return {
      ...parent,
      payment_method: split.method,
      amount_bs: split.amountBs,
      amount_usd: split.amountUsd,
      exchange_rate_used: split.exchangeRateUsed,
    };
  });

export const fromPaymentSplitRows = (
  rows: readonly PaymentSplitRow[]
): PaymentSplit[] =>
  rows.map((row) => ({
    method: row.method ?? row.payment_method ?? 'efectivo',
    amountBs: Number(row.amountBs ?? row.amount_bs ?? 0),
    amountUsd:
      row.amountUsd === null || row.amountUsd === undefined
        ? row.amount_usd === null || row.amount_usd === undefined
          ? undefined
          : Number(row.amount_usd)
        : Number(row.amountUsd),
    exchangeRateUsed:
      row.exchangeRateUsed === null || row.exchangeRateUsed === undefined
        ? row.exchange_rate_used === null || row.exchange_rate_used === undefined
          ? undefined
          : Number(row.exchange_rate_used)
        : Number(row.exchangeRateUsed),
  }));
