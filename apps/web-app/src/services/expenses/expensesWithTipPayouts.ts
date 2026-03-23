import type { Expense } from '@/types';
import type { TipPayout } from '@/types/tips';
import { normalizeToVenezuelaDate } from '@/services/DateService';

const TIP_PAYOUT_EXPENSE_ID_PREFIX = 'tip-payout:';

function resolveTipPayoutDate(payout: TipPayout): string {
  return normalizeToVenezuelaDate(payout.paidAt || payout.tipDate);
}

export function isTipPayoutDerivedExpenseId(expenseId: string): boolean {
  return expenseId.startsWith(TIP_PAYOUT_EXPENSE_ID_PREFIX);
}

function toDerivedTipPayoutExpense(payout: TipPayout): Expense {
  return {
    id: `${TIP_PAYOUT_EXPENSE_ID_PREFIX}${payout.id}`,
    date: resolveTipPayoutDate(payout),
    description: 'Pago de Propina',
    amount: Number(payout.amountBs || 0),
    category: 'personal',
    paymentMethod: payout.paymentMethod,
    notes: payout.originType === 'sale' ? 'Origen: Venta' : 'Origen: Alquiler',
    createdAt: payout.paidAt || payout.tipDate,
  };
}

function dedupeTipPayoutsById(payouts: readonly TipPayout[]): TipPayout[] {
  const uniqueById = new Map<string, TipPayout>();
  for (const payout of payouts) {
    if (!uniqueById.has(payout.id)) {
      uniqueById.set(payout.id, payout);
    }
  }
  return Array.from(uniqueById.values());
}

export function mergeExpensesWithTipPayouts(params: {
  date: string;
  expenses: readonly Expense[];
  tipPayouts: readonly TipPayout[];
}): Expense[] {
  const { date, expenses, tipPayouts } = params;

  const derived = dedupeTipPayoutsById(tipPayouts)
    .filter((payout) => resolveTipPayoutDate(payout) === date)
    .map(toDerivedTipPayoutExpense);

  return [...expenses, ...derived].sort(
    (a, b) =>
      new Date(a.createdAt || a.date).getTime() -
      new Date(b.createdAt || b.date).getTime()
  );
}
