import type { PaymentBalanceTransaction } from '@/types';

const DIFFERENCE_EPSILON = 0.000001;

function toFiniteNumber(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

function resolveFirstNumber(...candidates: Array<number | undefined>): number {
  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value !== undefined) {
      return value;
    }
  }

  return 0;
}

export interface PaymentBalanceTransferLegs {
  amountOutBs: number;
  amountInBs: number;
  differenceBs: number;
  operationType: 'equilibrio' | 'avance';
}

export function resolvePaymentBalanceTransferLegs(
  transaction: PaymentBalanceTransaction,
  exchangeRate: number
): PaymentBalanceTransferLegs {
  const amountOutBs = resolveFirstNumber(
    transaction.amountOutBs,
    toFiniteNumber(transaction.amountOutUsd) !== undefined
      ? Number(transaction.amountOutUsd) * exchangeRate
      : undefined,
    transaction.amountBs,
    toFiniteNumber(transaction.amountUsd) !== undefined
      ? Number(transaction.amountUsd) * exchangeRate
      : undefined,
    transaction.amount
  );

  const amountInBs = resolveFirstNumber(
    transaction.amountInBs,
    toFiniteNumber(transaction.amountInUsd) !== undefined
      ? Number(transaction.amountInUsd) * exchangeRate
      : undefined,
    transaction.amountBs,
    toFiniteNumber(transaction.amountUsd) !== undefined
      ? Number(transaction.amountUsd) * exchangeRate
      : undefined,
    transaction.amount
  );

  const differenceBs =
    toFiniteNumber(transaction.differenceBs) ?? amountInBs - amountOutBs;

  const operationType =
    transaction.operationType ??
    (Math.abs(differenceBs) > DIFFERENCE_EPSILON ? 'avance' : 'equilibrio');

  return {
    amountOutBs,
    amountInBs,
    differenceBs,
    operationType,
  };
}
