import {
  Sale,
  WasherRental,
  Expense,
  PrepaidOrder,
  PaymentBalanceTransaction,
  PaymentMethod,
  TipPayout,
} from '@/types';
import {
  allocateRentalToMethodTotalsBs,
  allocateSaleToMethodTotalsBs,
  createEmptyMethodTotals,
} from '@/services/payments/paymentSplitReadModel';
import { resolvePaymentBalanceTransferLegs } from '@/services/payments/paymentBalanceTransferSemantics';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';
import type { PaymentSplit } from '@/types/paymentSplits';
import { normalizeToVenezuelaDate } from '@/services/DateService';

export interface DateRange {
  start: string;
  end: string;
}

export interface ScopeMetrics {
  waterBs: number;
  rentalBs: number;
  totalIncomeBs: number;
  expenseBs: number;
  netBs: number;
  transactionsCount: number;
  methodTotalsBs: Record<PaymentMethod, number>;
}

export interface DashboardMetricsInput {
  selectedDate: string;
  exchangeRate: number;
  sales: readonly Sale[];
  rentals: readonly WasherRental[];
  expenses: readonly Expense[];
  prepaidOrders: readonly PrepaidOrder[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
  tipPayouts?: readonly TipPayout[];
}

export interface DashboardMetricsResult {
  day: ScopeMetrics;
  mtd: ScopeMetrics;
}

export function getMonthToDateRange(selectedDate: string): DateRange {
  const start = selectedDate.slice(0, 7) + '-01';
  return { start, end: selectedDate };
}

export function filterByDateRange<T>(
  items: readonly T[],
  range: DateRange,
  getDate: (item: T) => string
): T[] {
  return items.filter((item) => {
    const d = getDate(item).substring(0, 10);
    return d >= range.start && d <= range.end;
  });
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

function emptyMethodTotals(): Record<PaymentMethod, number> {
  return createEmptyMethodTotals();
}

interface SplitAwareSale extends Sale {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareRental extends WasherRental {
  paymentSplits?: PaymentSplit[];
}

interface SplitAwareExpense extends Expense {
  paymentSplits?: PaymentSplit[];
}

function computeExpenseTotalsByMethod(
  expenses: readonly Expense[]
): Record<PaymentMethod, number> {
  const totals = createEmptyMethodTotals();

  for (const expense of expenses as readonly SplitAwareExpense[]) {
    if (hasValidMixedPaymentSplits(expense.paymentSplits)) {
      for (const split of expense.paymentSplits) {
        totals[split.method] += Number(split.amountBs || 0);
      }
      continue;
    }

    totals[expense.paymentMethod] += Number(expense.amount || 0);
  }

  return totals;
}

function computeScope(
  range: DateRange,
  exchangeRate: number,
  sales: readonly Sale[],
  rentals: readonly WasherRental[],
  expenses: readonly Expense[],
  prepaidOrders: readonly PrepaidOrder[],
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[],
  tipPayouts: readonly TipPayout[]
): ScopeMetrics {
  const filteredSales = filterByDateRange(
    sales as readonly SplitAwareSale[],
    range,
    (s) => s.date
  );
  const filteredRentals = filterByDateRange(
    (rentals as readonly SplitAwareRental[]).filter(
      (r): r is SplitAwareRental & { datePaid: string } =>
        r.isPaid && Boolean(r.datePaid)
    ),
    range,
    (r) => r.datePaid
  );
  const filteredExpenses = filterByDateRange(expenses, range, (e) => e.date);
  const filteredPrepaid = filterByDateRange(
    prepaidOrders,
    range,
    (p) => p.datePaid
  );
  const filteredBalanceTx = filterByDateRange(
    paymentBalanceTransactions,
    range,
    (t) => t.date
  );
  const filteredTipPayouts = filterByDateRange(
    dedupeTipPayouts(tipPayouts),
    range,
    (tip) => resolveTipPayoutDate(tip)
  );

  const waterBs = filteredSales.reduce((sum, s) => sum + s.totalBs, 0);
  const rentalBs = filteredRentals.reduce(
    (sum, r) => sum + r.totalUsd * exchangeRate,
    0
  );
  const prepaidBs = filteredPrepaid.reduce((sum, p) => sum + p.amountBs, 0);

  const totalIncomeBs = waterBs + rentalBs + prepaidBs;
  const tipPayoutExpenseBs = filteredTipPayouts.reduce(
    (sum, payout) => sum + payout.amountBs,
    0
  );
  const expenseBs =
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0) + tipPayoutExpenseBs;

  const netBs = totalIncomeBs - expenseBs;

  const transactionsCount =
    filteredSales.length +
    filteredRentals.length +
    filteredBalanceTx.length +
    filteredTipPayouts.length;

  const methodTotalsBs = emptyMethodTotals();
  const salesTotals = filteredSales.reduce(
    (acc, sale) => allocateSaleToMethodTotalsBs(sale, acc),
    createEmptyMethodTotals()
  );
  const rentalsTotals = filteredRentals.reduce(
    (acc, rental) => allocateRentalToMethodTotalsBs(rental, exchangeRate, acc),
    createEmptyMethodTotals()
  );
  const expenseTotalsByMethod = computeExpenseTotalsByMethod(filteredExpenses);

  for (const method of PAYMENT_METHODS) {
    methodTotalsBs[method] += salesTotals[method];
    methodTotalsBs[method] += rentalsTotals[method];

    methodTotalsBs[method] += filteredPrepaid
      .filter((p) => p.paymentMethod === method)
      .reduce((sum, p) => sum + p.amountBs, 0);

    methodTotalsBs[method] -= expenseTotalsByMethod[method];

    for (const tx of filteredBalanceTx) {
      const { amountOutBs, amountInBs } = resolvePaymentBalanceTransferLegs(
        tx,
        exchangeRate
      );
      if (tx.fromMethod === method) {
        methodTotalsBs[method] -= amountOutBs;
      }
      if (tx.toMethod === method) {
        methodTotalsBs[method] += amountInBs;
      }
    }

    methodTotalsBs[method] -= filteredTipPayouts
      .filter((payout) => payout.paymentMethod === method)
      .reduce((sum, payout) => sum + payout.amountBs, 0);
  }

  return {
    waterBs,
    rentalBs,
    totalIncomeBs,
    expenseBs,
    netBs,
    transactionsCount,
    methodTotalsBs,
  };
}

export function calculateDashboardMetrics(
  input: DashboardMetricsInput
): DashboardMetricsResult {
  const {
    selectedDate,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    tipPayouts = [],
  } = input;

  const dayRange: DateRange = { start: selectedDate, end: selectedDate };
  const mtdRange = getMonthToDateRange(selectedDate);

  const day = computeScope(
    dayRange,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    tipPayouts
  );

  const mtd = computeScope(
    mtdRange,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    tipPayouts
  );

  return { day, mtd };
}

function resolveTipPayoutDate(payout: TipPayout): string {
  return normalizeToVenezuelaDate(payout.paidAt || payout.tipDate);
}

function dedupeTipPayouts(payouts: readonly TipPayout[]): TipPayout[] {
  const uniqueById = new Map<string, TipPayout>();
  for (const payout of payouts) {
    if (!uniqueById.has(payout.id)) {
      uniqueById.set(payout.id, payout);
    }
  }
  return Array.from(uniqueById.values());
}
