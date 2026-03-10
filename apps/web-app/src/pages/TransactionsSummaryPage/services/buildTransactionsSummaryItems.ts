import { PaymentMethodLabels } from '@/types';
import type {
  Expense,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';

export type TransactionType =
  | 'sale'
  | 'rental'
  | 'expense'
  | 'prepaid'
  | 'balance_transfer';

export interface TransactionItem {
  id: string;
  type: TransactionType;
  title: string;
  subtitle?: string;
  amountBs: number;
  amountUsd?: number;
  isIncome: boolean;
  paymentMethod?: string;
  timestamp: string;
  originalDate: string;
}

interface BuildTransactionsSummaryInput {
  selectedDate: string;
  exchangeRate: number;
  sales: readonly Sale[];
  rentals: readonly WasherRental[];
  expenses: readonly Expense[];
  prepaidOrders: readonly PrepaidOrder[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
}

function hasPaymentSplits(
  splits: PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  return Boolean(splits && splits.length > 0);
}

function toSplitItems(input: {
  baseId: string;
  type: TransactionType;
  title: string;
  subtitle?: string;
  paymentSplits: PaymentSplit[];
  timestamp: string;
  originalDate: string;
  isIncome: boolean;
}): TransactionItem[] {
  return input.paymentSplits.map((split, index) => ({
    id: `${input.baseId}-${split.method}-${index}`,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    amountBs: Number(split.amountBs || 0),
    amountUsd: split.amountUsd,
    isIncome: input.isIncome,
    paymentMethod: PaymentMethodLabels[split.method as PaymentMethod],
    timestamp: input.timestamp,
    originalDate: input.originalDate,
  }));
}

function resolveBalanceTransactionAmountBs(
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

export function buildTransactionsSummaryItems(
  input: BuildTransactionsSummaryInput
): TransactionItem[] {
  const {
    selectedDate,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
  } = input;

  const items: TransactionItem[] = [];

  sales
    .filter((sale) => sale.date === selectedDate)
    .forEach((sale) => {
      if (hasPaymentSplits(sale.paymentSplits)) {
        items.push(
          ...toSplitItems({
            baseId: sale.id,
            type: 'sale',
            title: `Venta de Agua #${sale.dailyNumber}`,
            subtitle: `${sale.items.length} items`,
            paymentSplits: sale.paymentSplits,
            timestamp: sale.createdAt,
            originalDate: sale.date,
            isIncome: true,
          })
        );
        return;
      }

      items.push({
        id: sale.id,
        type: 'sale',
        title: `Venta de Agua #${sale.dailyNumber}`,
        subtitle: `${sale.items.length} items`,
        amountBs: sale.totalBs,
        amountUsd: sale.totalUsd,
        isIncome: true,
        paymentMethod: PaymentMethodLabels[sale.paymentMethod],
        timestamp: sale.createdAt,
        originalDate: sale.date,
      });
    });

  rentals
    .filter(
      (rental) =>
        rental.isPaid && (rental.datePaid || rental.date) === selectedDate
    )
    .forEach((rental) => {
      if (hasPaymentSplits(rental.paymentSplits)) {
        items.push(
          ...toSplitItems({
            baseId: rental.id,
            type: 'rental',
            title: 'Alquiler de Lavadora',
            subtitle: rental.customerName || 'Cliente Eventual',
            paymentSplits: rental.paymentSplits,
            timestamp: rental.updatedAt || rental.createdAt,
            originalDate: rental.datePaid || rental.date,
            isIncome: true,
          })
        );
        return;
      }

      items.push({
        id: rental.id,
        type: 'rental',
        title: 'Alquiler de Lavadora',
        subtitle: rental.customerName || 'Cliente Eventual',
        amountBs: rental.totalUsd * exchangeRate,
        amountUsd: rental.totalUsd,
        isIncome: true,
        paymentMethod: PaymentMethodLabels[rental.paymentMethod],
        timestamp: rental.updatedAt || rental.createdAt,
        originalDate: rental.datePaid || rental.date,
      });
    });

  expenses
    .filter((expense) => expense.date === selectedDate)
    .forEach((expense) => {
      items.push({
        id: expense.id,
        type: 'expense',
        title:
          expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
        subtitle: expense.description,
        amountBs: expense.amount,
        amountUsd: expense.amount / exchangeRate,
        isIncome: false,
        paymentMethod: PaymentMethodLabels[expense.paymentMethod],
        timestamp: expense.createdAt,
        originalDate: expense.date,
      });
    });

  prepaidOrders
    .filter(
      (prepaid) => prepaid.datePaid === selectedDate && prepaid.amountBs > 0
    )
    .forEach((prepaid) => {
      items.push({
        id: prepaid.id,
        type: 'prepaid',
        title: 'Recarga Prepagada',
        subtitle: prepaid.customerName,
        amountBs: prepaid.amountBs,
        amountUsd: prepaid.amountUsd,
        isIncome: true,
        paymentMethod: PaymentMethodLabels[prepaid.paymentMethod],
        timestamp: prepaid.createdAt,
        originalDate: prepaid.datePaid,
      });
    });

  paymentBalanceTransactions
    .filter((transaction) => transaction.date === selectedDate)
    .forEach((transaction) => {
      items.push({
        id: transaction.id,
        type: 'balance_transfer',
        title: 'Ajuste de Caja',
        subtitle: `${PaymentMethodLabels[transaction.fromMethod]} ➔ ${
          PaymentMethodLabels[transaction.toMethod]
        }`,
        amountBs: resolveBalanceTransactionAmountBs(transaction, exchangeRate),
        amountUsd: transaction.amountUsd,
        isIncome: true,
        paymentMethod: 'Transferencia',
        timestamp: transaction.createdAt,
        originalDate: transaction.date,
      });
    });

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
