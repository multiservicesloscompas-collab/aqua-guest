import { PaymentMethodLabels } from '@/types';
import type {
  Expense,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  TipPayout,
  WasherRental,
} from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';
import { normalizeToVenezuelaDate } from '@/services/DateService';
import { resolvePaymentBalanceTransferLegs } from '@/services/payments/paymentBalanceTransferSemantics';

export type TransactionType =
  | 'sale'
  | 'rental'
  | 'expense'
  | 'prepaid'
  | 'balance_transfer'
  | 'tip_payout';

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
  tipPayouts?: readonly TipPayout[];
}

function hasPaymentSplits(
  splits: PaymentSplit[] | undefined
): splits is PaymentSplit[] {
  return hasValidMixedPaymentSplits(splits);
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
    paymentMethod: `Pago mixto · ${
      PaymentMethodLabels[split.method as PaymentMethod]
    }`,
    timestamp: input.timestamp,
    originalDate: input.originalDate,
  }));
}

function dedupeTipPayoutsById(payouts: readonly TipPayout[]): TipPayout[] {
  const byId = new Map<string, TipPayout>();
  for (const payout of payouts) {
    if (!byId.has(payout.id)) {
      byId.set(payout.id, payout);
    }
  }
  return Array.from(byId.values());
}

function resolveTipPayoutDate(payout: TipPayout): string {
  return normalizeToVenezuelaDate(payout.paidAt || payout.tipDate);
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
    tipPayouts = [],
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
      if (hasPaymentSplits(expense.paymentSplits)) {
        items.push(
          ...toSplitItems({
            baseId: expense.id,
            type: 'expense',
            title:
              expense.category.charAt(0).toUpperCase() +
              expense.category.slice(1),
            subtitle: expense.description,
            paymentSplits: expense.paymentSplits,
            timestamp: expense.createdAt,
            originalDate: expense.date,
            isIncome: false,
          })
        );
        return;
      }

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
      const { amountOutBs, amountInBs, differenceBs, operationType } =
        resolvePaymentBalanceTransferLegs(transaction, exchangeRate);

      items.push({
        id: transaction.id,
        type: 'balance_transfer',
        title:
          operationType === 'avance'
            ? 'Avance entre Métodos'
            : 'Ajuste de Caja',
        subtitle: `${PaymentMethodLabels[transaction.fromMethod]} ➔ ${
          PaymentMethodLabels[transaction.toMethod]
        } · Salida Bs ${amountOutBs.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} · Entrada Bs ${amountInBs.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} · Dif ${
          differenceBs >= 0 ? '+' : ''
        }Bs ${differenceBs.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        amountBs: amountInBs,
        amountUsd: transaction.amountInUsd ?? transaction.amountUsd,
        isIncome: true,
        paymentMethod:
          operationType === 'avance'
            ? 'Transferencia · Avance'
            : 'Transferencia',
        timestamp: transaction.createdAt,
        originalDate: transaction.date,
      });
    });

  dedupeTipPayoutsById(tipPayouts)
    .filter((payout) => resolveTipPayoutDate(payout) === selectedDate)
    .forEach((payout) => {
      items.push({
        id: payout.id,
        type: 'tip_payout',
        title: 'Pago de Propina',
        subtitle:
          payout.originType === 'sale' ? 'Origen: Venta' : 'Origen: Alquiler',
        amountBs: payout.amountBs,
        amountUsd: payout.amountBs / exchangeRate,
        isIncome: false,
        paymentMethod: PaymentMethodLabels[payout.paymentMethod],
        timestamp: payout.paidAt,
        originalDate: payout.tipDate,
      });
    });

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
