import type { ComponentType } from 'react';
import {
  ArrowLeftRight,
  Droplets,
  Receipt,
  WashingMachine,
} from 'lucide-react';
import type {
  Expense,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';
import {
  getRentalAmountForMethodBs,
  getRentalAmountForMethodUsd,
  getSaleAmountForMethodBs,
  getSaleAmountForMethodUsd,
  includesMethodInRental,
  includesMethodInSale,
} from '@/services/payments/paymentSplitAttribution';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';

export interface PaymentMethodDetailTransactionItem {
  id: string;
  type:
    | 'sale'
    | 'rental'
    | 'expense'
    | 'prepaid'
    | 'balance_in'
    | 'balance_out';
  typeLabel: string;
  description: string;
  amountBs: number;
  amountUsd?: number;
  paymentMethodLabel?: string;
  icon: ComponentType<{ className?: string }>;
}

export interface PaymentMethodDetailSummary {
  income: number;
  expenses: number;
  balanceIn: number;
  balanceOut: number;
  net: number;
}

interface BuildPaymentMethodTransactionsInput {
  paymentMethod: PaymentMethod;
  selectedDate: string;
  exchangeRate: number;
  sales: readonly Sale[];
  rentals: readonly WasherRental[];
  expenses: readonly Expense[];
  prepaidOrders: readonly PrepaidOrder[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
  getMethodLabel: (method: PaymentMethod) => string;
}

function resolveBalanceAmountBs(
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

export function buildPaymentMethodTransactions(
  input: BuildPaymentMethodTransactionsInput
): PaymentMethodDetailTransactionItem[] {
  const {
    paymentMethod,
    selectedDate,
    exchangeRate,
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    getMethodLabel,
  } = input;

  const items: PaymentMethodDetailTransactionItem[] = [];

  for (const sale of sales) {
    if (
      sale.date !== selectedDate ||
      !includesMethodInSale(sale, paymentMethod)
    ) {
      continue;
    }
    const isMixed = hasValidMixedPaymentSplits(sale.paymentSplits);
    items.push({
      id: sale.id,
      type: 'sale',
      typeLabel: isMixed ? 'Venta de Agua · Pago mixto' : 'Venta de Agua',
      description: `${sale.items.length} producto${
        sale.items.length > 1 ? 's' : ''
      }${isMixed ? ` · ${getMethodLabel(paymentMethod)}` : ''}`,
      amountBs: getSaleAmountForMethodBs(sale, paymentMethod),
      amountUsd: getSaleAmountForMethodUsd(sale, paymentMethod, exchangeRate),
      paymentMethodLabel: isMixed ? getMethodLabel(paymentMethod) : undefined,
      icon: Droplets,
    });
  }

  for (const rental of rentals) {
    if (
      !rental.isPaid ||
      (rental.datePaid || rental.date) !== selectedDate ||
      !includesMethodInRental(rental, paymentMethod)
    ) {
      continue;
    }
    const isMixed = hasValidMixedPaymentSplits(rental.paymentSplits);
    items.push({
      id: rental.id,
      type: 'rental',
      typeLabel: isMixed
        ? 'Alquiler de Lavadora · Pago mixto'
        : 'Alquiler de Lavadora',
      description: `${rental.customerName} - ${rental.shift}${
        isMixed ? ` · ${getMethodLabel(paymentMethod)}` : ''
      }`,
      amountBs: getRentalAmountForMethodBs(rental, paymentMethod, exchangeRate),
      amountUsd: getRentalAmountForMethodUsd(
        rental,
        paymentMethod,
        exchangeRate
      ),
      paymentMethodLabel: isMixed ? getMethodLabel(paymentMethod) : undefined,
      icon: WashingMachine,
    });
  }

  for (const expense of expenses) {
    if (
      expense.date !== selectedDate ||
      expense.paymentMethod !== paymentMethod
    ) {
      continue;
    }
    items.push({
      id: expense.id,
      type: 'expense',
      typeLabel: 'Egreso',
      description: expense.description,
      amountBs: expense.amount,
      icon: Receipt,
    });
  }

  for (const prepaid of prepaidOrders) {
    if (
      prepaid.datePaid !== selectedDate ||
      prepaid.paymentMethod !== paymentMethod
    ) {
      continue;
    }
    items.push({
      id: prepaid.id,
      type: 'prepaid',
      typeLabel: 'Agua Prepagada',
      description: `${prepaid.customerName} - ${prepaid.liters}L`,
      amountBs: prepaid.amountBs,
      amountUsd: prepaid.amountUsd,
      icon: Droplets,
    });
  }

  for (const tx of paymentBalanceTransactions) {
    if (tx.date !== selectedDate) {
      continue;
    }

    const amountBs = resolveBalanceAmountBs(
      tx.amount,
      tx.amountBs,
      tx.amountUsd,
      exchangeRate
    );

    if (tx.fromMethod === paymentMethod) {
      items.push({
        id: tx.id,
        type: 'balance_out',
        typeLabel: 'Equilibrio (Salida)',
        description: `Transferencia a ${getMethodLabel(tx.toMethod)}`,
        amountBs,
        icon: ArrowLeftRight,
      });
    }

    if (tx.toMethod === paymentMethod) {
      items.push({
        id: tx.id,
        type: 'balance_in',
        typeLabel: 'Equilibrio (Entrada)',
        description: `Transferencia desde ${getMethodLabel(tx.fromMethod)}`,
        amountBs,
        icon: ArrowLeftRight,
      });
    }
  }

  return items;
}

export function summarizePaymentMethodTransactions(
  transactions: readonly PaymentMethodDetailTransactionItem[]
): PaymentMethodDetailSummary {
  const income = transactions
    .filter(
      (t) => t.type === 'sale' || t.type === 'rental' || t.type === 'prepaid'
    )
    .reduce((sum, t) => sum + t.amountBs, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountBs, 0);
  const balanceIn = transactions
    .filter((t) => t.type === 'balance_in')
    .reduce((sum, t) => sum + t.amountBs, 0);
  const balanceOut = transactions
    .filter((t) => t.type === 'balance_out')
    .reduce((sum, t) => sum + t.amountBs, 0);

  return {
    income,
    expenses,
    balanceIn,
    balanceOut,
    net: income - expenses + balanceIn - balanceOut,
  };
}
