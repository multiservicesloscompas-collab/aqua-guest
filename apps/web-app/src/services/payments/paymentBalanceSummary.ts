import type {
  PaymentBalanceSummary,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';
import {
  allocateRentalToMethodTotalsBs,
  allocateSaleToMethodTotalsBs,
  createEmptyMethodTotals,
  getPaymentMethods,
} from '@/services/payments/paymentSplitReadModel';

interface PaymentBalanceSummaryInput {
  date: string;
  exchangeRate: number;
  sales: readonly Sale[];
  prepaidOrders: readonly PrepaidOrder[];
  rentals: readonly WasherRental[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
}

function getBalanceTransactionAmountBs(
  transaction: PaymentBalanceTransaction,
  exchangeRate: number
): number {
  if (transaction.amountBs !== undefined) {
    return Number(transaction.amountBs);
  }

  if (transaction.amountUsd !== undefined) {
    return Number(transaction.amountUsd) * exchangeRate;
  }

  return Number(transaction.amount);
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

  const adjustments = createEmptyMethodTotals();
  const balanceTransactionsOfDay = paymentBalanceTransactions.filter(
    (transaction) => transaction.date === date
  );

  for (const transaction of balanceTransactionsOfDay) {
    const amountBs = getBalanceTransactionAmountBs(transaction, exchangeRate);
    adjustments[transaction.fromMethod] -= amountBs;
    adjustments[transaction.toMethod] += amountBs;
  }

  return methods.map((method: PaymentMethod) => ({
    method,
    originalTotal: originalTotals[method],
    adjustments: adjustments[method],
    finalTotal: originalTotals[method] + adjustments[method],
  }));
}
