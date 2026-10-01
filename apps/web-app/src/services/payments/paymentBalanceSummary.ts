import type {
  Expense,
  PaymentBalanceSummary,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  TipPayout,
  WasherRental,
} from '@/types';
import {
  allocateRentalToMethodTotalsBs,
  allocateSaleToMethodTotalsBs,
  createEmptyMethodTotals,
  getPaymentMethods,
} from '@/services/payments/paymentSplitReadModel';
import { resolvePaymentBalanceTransferLegs } from '@/services/payments/paymentBalanceTransferSemantics';
import {
  computeExpenseTotalsByMethod,
  dedupeTipPayouts,
  resolveTipPayoutDate,
} from '@/services/payments/methodOutflows';

interface PaymentBalanceSummaryInput {
  date: string;
  exchangeRate: number;
  sales: readonly Sale[];
  prepaidOrders: readonly PrepaidOrder[];
  rentals: readonly WasherRental[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
  expenses?: readonly Expense[];
  tipPayouts?: readonly TipPayout[];
}

export function calculatePaymentBalanceSummary(
  input: PaymentBalanceSummaryInput
): PaymentBalanceSummary[] {
  const {
    date,
    exchangeRate,
    sales,
    prepaidOrders,
    rentals,
    paymentBalanceTransactions,
    expenses = [],
    tipPayouts = [],
  } = input;

  const methods = getPaymentMethods();
  const originalTotals = createEmptyMethodTotals();

  const salesOfDay = sales.filter((sale) => sale.date === date);
  for (const sale of salesOfDay) {
    Object.assign(
      originalTotals,
      allocateSaleToMethodTotalsBs(sale, originalTotals)
    );
  }

  const prepaidOfDay = prepaidOrders.filter(
    (prepaid) => prepaid.datePaid === date
  );
  for (const prepaid of prepaidOfDay) {
    originalTotals[prepaid.paymentMethod] += Number(prepaid.amountBs || 0);
  }

  const paidRentalsOfDay = rentals.filter(
    (rental) =>
      rental.isPaid && (rental.datePaid === date || rental.date === date)
  );
  for (const rental of paidRentalsOfDay) {
    Object.assign(
      originalTotals,
      allocateRentalToMethodTotalsBs(rental, exchangeRate, originalTotals)
    );
  }

  // What actually left each method that day (expenses and paid tip payouts), so
  // the per-method total matches the dashboard cards.
  const expenseTotals = computeExpenseTotalsByMethod(
    expenses.filter((expense) => expense.date === date)
  );
  const payoutsOfDay = dedupeTipPayouts(tipPayouts).filter(
    (payout) => resolveTipPayoutDate(payout) === date
  );
  for (const method of methods) {
    originalTotals[method] -= expenseTotals[method];
  }
  for (const payout of payoutsOfDay) {
    originalTotals[payout.paymentMethod] -= Number(payout.amountBs || 0);
  }

  const adjustments = createEmptyMethodTotals();
  const balanceTransactionsOfDay = paymentBalanceTransactions.filter(
    (transaction) => transaction.date === date
  );

  for (const transaction of balanceTransactionsOfDay) {
    const { amountOutBs, amountInBs } = resolvePaymentBalanceTransferLegs(
      transaction,
      exchangeRate
    );
    adjustments[transaction.fromMethod] -= amountOutBs;
    adjustments[transaction.toMethod] += amountInBs;
  }

  return methods.map((method: PaymentMethod) => ({
    method,
    originalTotal: originalTotals[method],
    adjustments: adjustments[method],
    finalTotal: originalTotals[method] + adjustments[method],
  }));
}
