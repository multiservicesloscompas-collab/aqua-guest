import type { PaymentSplit } from '@/types/paymentSplits';

const DEFAULT_DECIMALS = 2;

export function roundToCurrency(
  value: number,
  decimals = DEFAULT_DECIMALS
): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function reconcileSplitKey(
  total: number,
  entries: readonly PaymentSplit[],
  key: 'amountBs' | 'amountUsd'
): PaymentSplit[] {
  if (!entries.length) return [];

  const roundedTotal = roundToCurrency(total);
  const roundedEntries: PaymentSplit[] = entries.map((entry) => ({
    ...entry,
    [key]: roundToCurrency(Number(entry[key] ?? 0)),
  }));

  const currentSum = roundedEntries.reduce(
    (sum, entry) => sum + Number(entry[key] ?? 0),
    0
  );

  const diff = roundToCurrency(roundedTotal - currentSum);
  if (diff === 0) return roundedEntries;

  const targetIndex = roundedEntries.reduce(
    (largestIndex, entry, index, all) => {
      const entryValue = Number(entry[key] ?? 0);
      const largestValue = Number(all[largestIndex]?.[key] ?? 0);
      if (entryValue > largestValue) return index;
      return largestIndex;
    },
    0
  );

  return roundedEntries.map((entry, index) => {
    if (index !== targetIndex) return entry;
    return {
      ...entry,
      [key]: roundToCurrency(Number(entry[key] ?? 0) + diff),
    };
  });
}

export function reconcileSplitAmountsBs(
  totalBs: number,
  splits: readonly PaymentSplit[]
): PaymentSplit[] {
  return reconcileSplitKey(totalBs, splits, 'amountBs');
}

export function reconcileSplitAmountsUsd(
  totalUsd: number,
  splits: readonly PaymentSplit[]
): PaymentSplit[] {
  return reconcileSplitKey(totalUsd, splits, 'amountUsd');
}
