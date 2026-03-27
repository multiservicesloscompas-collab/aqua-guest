import type { TipPayout } from '@/types';
import { normalizeToVenezuelaDate } from '@/services/DateService';

export function dedupeTipPayoutsById(
  payouts: readonly TipPayout[]
): TipPayout[] {
  const byId = new Map<string, TipPayout>();
  for (const payout of payouts) {
    if (!byId.has(payout.id)) {
      byId.set(payout.id, payout);
    }
  }
  return Array.from(byId.values());
}

export function resolveBalanceAmountBs(
  amount: number,
  amountBs: number | undefined,
  amountUsd: number | undefined,
  exchangeRate: number
): number {
  if (amountBs !== undefined) {
    return Number(amountBs);
  }
  if (amountUsd !== undefined) {
    return Number(amountUsd) * exchangeRate;
  }
  return Number(amount);
}

export function resolveTipPayoutDate(payout: TipPayout): string {
  return normalizeToVenezuelaDate(payout.paidAt || payout.tipDate);
}
