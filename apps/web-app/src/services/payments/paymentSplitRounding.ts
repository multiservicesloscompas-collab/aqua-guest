import type { PaymentSplit } from '@aqua-guest/domain';
import { isChangeSplit } from '@aqua-guest/domain';

const DEFAULT_DECIMALS = 2;

export function roundToCurrency(
  value: number,
  decimals = DEFAULT_DECIMALS
): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Picks which split absorbs a rounding residual. Return the split's index,
 * or `-1` to defer to the default (largest-value) target. Selectors never
 * see already-rounded amounts — they run against the raw entries.
 */
export type ResidualTargetSelector = (
  splits: readonly PaymentSplit[]
) => number;

function defaultTargetIndex(
  entries: readonly PaymentSplit[],
  key: 'amountBs' | 'amountUsd'
): number {
  return entries.reduce((largestIndex, entry, index, all) => {
    const entryValue = Number(entry[key] ?? 0);
    const largestValue = Number(all[largestIndex]?.[key] ?? 0);
    if (entryValue > largestValue) return index;
    return largestIndex;
  }, 0);
}

function reconcileSplitKey(
  total: number,
  entries: readonly PaymentSplit[],
  key: 'amountBs' | 'amountUsd',
  selectResidualTarget?: ResidualTargetSelector
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

  const selectedIndex = selectResidualTarget?.(entries) ?? -1;
  const targetIndex =
    selectedIndex >= 0 ? selectedIndex : defaultTargetIndex(entries, key);

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
  splits: readonly PaymentSplit[],
  selectResidualTarget?: ResidualTargetSelector
): PaymentSplit[] {
  return reconcileSplitKey(totalBs, splits, 'amountBs', selectResidualTarget);
}

export function reconcileSplitAmountsUsd(
  totalUsd: number,
  splits: readonly PaymentSplit[],
  selectResidualTarget?: ResidualTargetSelector
): PaymentSplit[] {
  return reconcileSplitKey(
    totalUsd,
    splits,
    'amountUsd',
    selectResidualTarget
  );
}

/**
 * Targets the last non-divisa change leg (the Bs "resto" of a divisa
 * tender) for the rounding residual. Falls back (`-1`) to the default
 * largest-value target when there is no such leg — e.g. a divisa payment
 * whose change is entirely in USD bills, with no Bs remainder.
 *
 * Never targets a divisa leg: those are counts of physical bills and must
 * stay exact.
 */
export const preferNonDivisaChangeLeg: ResidualTargetSelector = (splits) => {
  for (let index = splits.length - 1; index >= 0; index -= 1) {
    const split = splits[index];
    if (isChangeSplit(split) && split.method !== 'divisa') {
      return index;
    }
  }
  return -1;
};
