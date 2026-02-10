import {
  Sale,
  WasherRental,
  Expense,
  PrepaidOrder,
  PaymentBalanceTransaction,
  PaymentMethod,
} from '@/types';

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
    const d = getDate(item);
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
  return {
    efectivo: 0,
    pago_movil: 0,
    punto_venta: 0,
    divisa: 0,
  };
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
  const filteredSales = filterByDateRange(sales, range, (s) => s.date);
  // Solo considerar alquileres pagados, usando datePaid si existe, sino date
  const filteredRentals = filterByDateRange(
    rentals.filter((r) => r.isPaid),
    range,
    (r) => r.datePaid || r.date
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
  const transactionsCount = filteredSales.length + filteredRentals.length;

  const methodTotalsBs = emptyMethodTotals();

  for (const method of PAYMENT_METHODS) {
    methodTotalsBs[method] += filteredSales
      .filter((s) => s.paymentMethod === method)
      .reduce((sum, s) => sum + s.totalBs, 0);

    methodTotalsBs[method] += filteredRentals
      .filter((r) => r.paymentMethod === method)
      .reduce((sum, r) => sum + r.totalUsd * exchangeRate, 0);

    methodTotalsBs[method] += filteredPrepaid
      .filter((p) => p.paymentMethod === method)
      .reduce((sum, p) => sum + p.amountBs, 0);

    methodTotalsBs[method] -= filteredExpenses
      .filter((e) => e.paymentMethod === method)
      .reduce((sum, e) => sum + e.amount, 0);

    for (const tx of filteredBalanceTx) {
      if (tx.fromMethod === method) {
        methodTotalsBs[method] -= tx.amount;
      }
      if (tx.toMethod === method) {
        methodTotalsBs[method] += tx.amount;
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
