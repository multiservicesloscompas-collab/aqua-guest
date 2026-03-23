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
import { resolvePaymentBalanceTransferLegs } from '@/services/payments/paymentBalanceTransferSemantics';

interface PaymentBalanceSummaryInput {
  date: string;
  exchangeRate: number;
  sales: readonly Sale[];
  prepaidOrders: readonly PrepaidOrder[];
  rentals: readonly WasherRental[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
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
