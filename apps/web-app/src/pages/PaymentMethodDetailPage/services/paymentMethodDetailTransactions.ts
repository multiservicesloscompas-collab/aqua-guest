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
  TipPayout,
  WasherRental,
} from '@/types';
import {
  getRentalAmountForMethodBs,
  getRentalAmountForMethodUsd,
  getSaleAmountForMethodBs,
  getSaleAmountForMethodUsd,
  includesMethodInRental,
  includesMethodInSale,
  includesMethodInExpense,
  getExpenseAmountForMethodBs,
} from '@/services/payments/paymentSplitAttribution';
import {
  buildGenericReference,
  buildRentalReference,
  buildSaleReference,
  buildTipPayoutReference,
} from './paymentMethodLinkedReference';
import {
  dedupeTipPayoutsById,
  resolveTipPayoutDate,
} from './paymentMethodDetailTransactionsHelpers';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';
import { resolvePaymentBalanceTransferLegs } from '@/services/payments/paymentBalanceTransferSemantics';

export interface PaymentMethodDetailTransactionItem {
  id: string;
  type:
    | 'sale'
    | 'rental'
    | 'expense'
    | 'prepaid'
    | 'tip_payout'
    | 'balance_in'
    | 'balance_out';
  typeLabel: string;
  description: string;
  amountBs: number;
  amountUsd?: number;
  paymentMethodLabel?: string;
  linkedReference: string;
  icon: ComponentType<{ className?: string }>;
}

export interface PaymentMethodDetailSummary {
  income: number;
  expenses: number;
  balanceIn: number;
  balanceOut: number;
  net: number;
}

export interface BuildPaymentMethodTransactionsInput {
  paymentMethod: PaymentMethod;
  selectedDate: string;
  exchangeRate: number;
  sales: readonly Sale[];
  rentals: readonly WasherRental[];
  expenses: readonly Expense[];
  prepaidOrders: readonly PrepaidOrder[];
  paymentBalanceTransactions: readonly PaymentBalanceTransaction[];
  tipPayouts?: readonly TipPayout[];
  getMethodLabel: (method: PaymentMethod) => string;
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
    tipPayouts = [],
    getMethodLabel,
  } = input;

  const items: PaymentMethodDetailTransactionItem[] = [];
  const salesById = new Map(
    sales.map((sale) => [
      sale.id,
      { id: sale.id, dailyNumber: sale.dailyNumber },
    ])
  );

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
      linkedReference: buildSaleReference(sale),
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
      linkedReference: buildRentalReference(rental.id),
      icon: WashingMachine,
    });
  }

  for (const expense of expenses) {
    if (
      expense.date !== selectedDate ||
      !includesMethodInExpense(expense, paymentMethod)
    ) {
      continue;
    }
    const isMixed = hasValidMixedPaymentSplits(expense.paymentSplits);
    items.push({
      id: expense.id,
      type: 'expense',
      typeLabel: isMixed ? 'Egreso · Pago mixto' : 'Egreso',
      description: `${expense.description}${
        isMixed ? ` · ${getMethodLabel(paymentMethod)}` : ''
      }`,
      amountBs: getExpenseAmountForMethodBs(expense, paymentMethod),
      paymentMethodLabel: isMixed ? getMethodLabel(paymentMethod) : undefined,
      linkedReference: buildGenericReference('Egreso', expense.id),
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
      linkedReference: buildGenericReference('Prepagado', prepaid.id),
      icon: Droplets,
    });
  }

  for (const tx of paymentBalanceTransactions) {
    if (tx.date !== selectedDate) {
      continue;
    }

    const { amountOutBs, amountInBs, differenceBs, operationType } =
      resolvePaymentBalanceTransferLegs(tx, exchangeRate);

    const movementLabel = operationType === 'avance' ? 'Avance' : 'Equilibrio';
    const movementReference = buildGenericReference(movementLabel, tx.id);
    const differenceText = `${
      differenceBs >= 0 ? '+' : ''
    }Bs ${differenceBs.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    if (tx.fromMethod === paymentMethod) {
      items.push({
        id: tx.id,
        type: 'balance_out',
        typeLabel: `${movementLabel} (Salida)`,
        description: `Transferencia a ${getMethodLabel(
          tx.toMethod
        )} · Salida ${amountOutBs.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} · Dif ${differenceText}`,
        amountBs: amountOutBs,
        linkedReference: movementReference,
        icon: ArrowLeftRight,
      });
    }

    if (tx.toMethod === paymentMethod) {
      items.push({
        id: tx.id,
        type: 'balance_in',
        typeLabel: `${movementLabel} (Entrada)`,
        description: `Transferencia desde ${getMethodLabel(
          tx.fromMethod
        )} · Entrada ${amountInBs.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} · Dif ${differenceText}`,
        amountBs: amountInBs,
        linkedReference: movementReference,
        icon: ArrowLeftRight,
      });
    }
  }

  for (const payout of dedupeTipPayoutsById(tipPayouts)) {
    if (
      payout.paymentMethod !== paymentMethod ||
      resolveTipPayoutDate(payout) !== selectedDate
    ) {
      continue;
    }

    items.push({
      id: payout.id,
      type: 'tip_payout',
      typeLabel: 'Pago de Propina',
      description:
        payout.originType === 'sale' ? 'Origen: Venta' : 'Origen: Alquiler',
      amountBs: payout.amountBs,
      amountUsd: payout.amountBs / exchangeRate,
      linkedReference: buildTipPayoutReference(payout, salesById),
      icon: Receipt,
    });
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
    .filter((t) => t.type === 'expense' || t.type === 'tip_payout')
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
