import type {
  Expense,
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
  TipPayout,
  WasherRental,
} from '@/types';

/** Day-scoped financial records shared by dashboard, summary and detail builders. */
export interface FinancialActivitySnapshot {
  selectedDate: string;
  exchangeRate: number;
  sales: readonly Sale[];
  rentals: readonly WasherRental[];
  expenses: readonly Expense[];
  prepaidOrders: readonly PrepaidOrder[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
  tipPayouts?: readonly TipPayout[];
}
