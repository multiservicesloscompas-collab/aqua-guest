import {
  Sale,
  WasherRental,
  Expense,
  PrepaidOrder,
  PaymentBalanceTransaction,
  PaymentMethod,
} from '@/types';
import {
  allocateRentalToMethodTotalsBs,
  allocateSaleToMethodTotalsBs,
  createEmptyMethodTotals,
} from '@/services/payments/paymentSplitReadModel';
import type { PaymentSplit } from '@/types/paymentSplits';

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

function getBalanceTransactionAmountBs(
  tx: PaymentBalanceTransaction,
  exchangeRate: number
): number {
  if (tx.amountBs !== undefined) {
    return Number(tx.amountBs);
  }
  if (tx.amountUsd !== undefined) {
    return Number(tx.amountUsd) * exchangeRate;
  }
  return Number(tx.amount || 0);
}

function computeScope(
  range: DateRange,
  exchangeRate: number,
  sales: readonly Sale[],
  rentals: readonly WasherRental[],
  expenses: readonly Expense[],
  prepaidOrders: readonly PrepaidOrder[],
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[]
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

  const waterBs = filteredSales.reduce((sum, s) => sum + s.totalBs, 0);
  const rentalBs = filteredRentals.reduce(
    (sum, r) => sum + r.totalUsd * exchangeRate,
    0
  );
  const prepaidBs = filteredPrepaid.reduce((sum, p) => sum + p.amountBs, 0);

  const totalIncomeBs = waterBs + rentalBs + prepaidBs;
  const expenseBs = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const netBs = totalIncomeBs - expenseBs;

  const transactionsCount =
    filteredSales.length + filteredRentals.length + filteredBalanceTx.length;

  const methodTotalsBs = emptyMethodTotals();
  const salesTotals = filteredSales.reduce(
    (acc, sale) => allocateSaleToMethodTotalsBs(sale, acc),
    createEmptyMethodTotals()
  );
  const rentalsTotals = filteredRentals.reduce(
    (acc, rental) => allocateRentalToMethodTotalsBs(rental, exchangeRate, acc),
    createEmptyMethodTotals()
  );

  for (const method of PAYMENT_METHODS) {
    methodTotalsBs[method] += salesTotals[method];
    methodTotalsBs[method] += rentalsTotals[method];

    methodTotalsBs[method] += filteredPrepaid
      .filter((p) => p.paymentMethod === method)
      .reduce((sum, p) => sum + p.amountBs, 0);

    methodTotalsBs[method] -= filteredExpenses
      .filter((e) => e.paymentMethod === method)
      .reduce((sum, e) => sum + e.amount, 0);

    for (const tx of filteredBalanceTx) {
      const amountBs = getBalanceTransactionAmountBs(tx, exchangeRate);
      if (tx.fromMethod === method) {
        methodTotalsBs[method] -= amountBs;
      }
      if (tx.toMethod === method) {
        methodTotalsBs[method] += amountBs;
      }
    }
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
    paymentBalanceTransactions
  );

  const mtd = computeScope(
    mtdRange,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions
  );

  return { day, mtd };
}
