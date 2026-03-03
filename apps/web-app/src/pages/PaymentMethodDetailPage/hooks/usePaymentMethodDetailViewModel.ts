import { ComponentType, useMemo } from 'react';
import {
  ArrowLeftRight,
  Droplets,
  Receipt,
  WashingMachine,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { usePrepaidStore } from '@/store/usePrepaidStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useRentalStore } from '@/store/useRentalStore';
import { createCurrencyConverter } from '@/services/CurrencyService';
import {
  AppRoute,
  PaymentMethod,
  PaymentMethodLabels,
  WasherRental,
} from '@/types';
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_ORDER,
} from '../services/paymentMethodDetailConfig';

interface TransactionViewItem {
  key: string;
  typeLabel: string;
  description: string;
  amountText: string;
  amountUsdText?: string;
  icon: ComponentType<{ className?: string }>;
  containerClass: string;
  iconWrapperClass: string;
  iconClass: string;
  amountClass: string;
}

interface SwitcherItem {
  method: PaymentMethod;
  title: string;
  icon: ComponentType<{ className?: string }>;
  buttonClass: string;
  iconClass: string;
}

interface PaymentMethodDetailViewModel {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  pageTitle: string;
  onBackRoute: AppRoute;
  kpi: {
    title: string;
    valueText: string;
    subtitleText: string;
    icon: ComponentType<{ className?: string }>;
    iconClass: string;
    borderClass: string;
  };
  summary: {
    incomeText: string;
    expensesText: string;
    balanceNetText: string;
    balanceNetClass: string;
    balanceDetailText?: string;
    borderClass: string;
  };
  switcherItems: SwitcherItem[];
  transactions: TransactionViewItem[];
  transactionsCount: number;
  emptyState: {
    message: string;
    icon: ComponentType<{ className?: string }>;
  };
}

interface TransactionItem {
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
  icon: ComponentType<{ className?: string }>;
  isNegative?: boolean;
}

function formatBs(amount: number) {
  return `Bs ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

function formatUsd(amount: number) {
  return `$${amount.toFixed(2)} USD`;
}

function getMethodLabel(method: PaymentMethod) {
  return PaymentMethodLabels[method];
}

function mapTransactionTone(
  type: TransactionItem['type'],
  baseConfig: { bgClass: string; colorClass: string }
) {
  const isNegative = type === 'expense' || type === 'balance_out';
  if (isNegative) {
    return {
      containerClass: 'bg-red-50/50 border-red-100',
      iconWrapperClass: 'bg-red-100 text-red-600',
      iconClass: 'text-red-600',
      amountClass: 'text-red-600',
      prefix: '-',
    };
  }
  if (type === 'balance_in') {
    return {
      containerClass: 'bg-blue-50/50 border-blue-100',
      iconWrapperClass: 'bg-blue-100 text-blue-600',
      iconClass: 'text-blue-600',
      amountClass: 'text-blue-600',
      prefix: '+',
    };
  }
  return {
    containerClass: 'bg-muted/30 border-border',
    iconWrapperClass: baseConfig.bgClass,
    iconClass: baseConfig.colorClass,
    amountClass: 'text-foreground',
    prefix: '',
  };
}

function getSummary(rentals: TransactionItem[]) {
  const income = rentals
    .filter((t) => ['sale', 'rental', 'prepaid'].includes(t.type))
    .reduce((sum, t) => sum + t.amountBs, 0);
  const expenses = rentals
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountBs, 0);
  const balanceIn = rentals
    .filter((t) => t.type === 'balance_in')
    .reduce((sum, t) => sum + t.amountBs, 0);
  const balanceOut = rentals
    .filter((t) => t.type === 'balance_out')
    .reduce((sum, t) => sum + t.amountBs, 0);
  const net = income - expenses + balanceIn - balanceOut;

  return { income, expenses, balanceIn, balanceOut, net };
}

export function usePaymentMethodDetailViewModel(
  paymentMethod: PaymentMethod
): PaymentMethodDetailViewModel {
  const { selectedDate, setSelectedDate } = useAppStore();
  const { prepaidOrders } = usePrepaidStore();
  const { sales } = useWaterSalesStore();
  const { expenses } = useExpenseStore();
  const { paymentBalanceTransactions } = usePaymentBalanceStore();
  const { config } = useConfigStore();
  const { rentals } = useRentalStore();

  const currencyConverter = useMemo(
    () => createCurrencyConverter(config.exchangeRate),
    [config.exchangeRate]
  );

  const methodConfig = PAYMENT_METHOD_CONFIG[paymentMethod];
  const paymentLabel = getMethodLabel(paymentMethod);

  const transactions = useMemo(() => {
    const items: TransactionItem[] = [];

    const daySales = sales.filter(
      (s) => s.date === selectedDate && s.paymentMethod === paymentMethod
    );
    daySales.forEach((sale) => {
      items.push({
        id: sale.id,
        type: 'sale',
        typeLabel: 'Venta de Agua',
        description: `${sale.items.length} producto${
          sale.items.length > 1 ? 's' : ''
        }`,
        amountBs: sale.totalBs,
        amountUsd: sale.totalUsd,
        icon: Droplets,
      });
    });

    const dayRentals = rentals.filter(
      (r: WasherRental) =>
        r.isPaid &&
        r.datePaid === selectedDate &&
        r.paymentMethod === paymentMethod
    );
    dayRentals.forEach((rental) => {
      items.push({
        id: rental.id,
        type: 'rental',
        typeLabel: 'Alquiler de Lavadora',
        description: `${rental.customerName} - ${rental.shift}`,
        amountBs: currencyConverter.toBs(rental.totalUsd),
        amountUsd: rental.totalUsd,
        icon: WashingMachine,
      });
    });

    const dayExpenses = expenses.filter(
      (e) => e.date === selectedDate && e.paymentMethod === paymentMethod
    );
    dayExpenses.forEach((expense) => {
      items.push({
        id: expense.id,
        type: 'expense',
        typeLabel: 'Egreso',
        description: expense.description,
        amountBs: expense.amount,
        icon: Receipt,
        isNegative: true,
      });
    });

    const dayPrepaid = prepaidOrders.filter(
      (p) => p.datePaid === selectedDate && p.paymentMethod === paymentMethod
    );
    dayPrepaid.forEach((prepaid) => {
      items.push({
        id: prepaid.id,
        type: 'prepaid',
        typeLabel: 'Agua Prepagada',
        description: `${prepaid.customerName} - ${prepaid.liters}L`,
        amountBs: prepaid.amountBs,
        amountUsd: prepaid.amountUsd,
        icon: Droplets,
      });
    });

    const dayBalanceTx = paymentBalanceTransactions.filter(
      (t) => t.date === selectedDate
    );
    dayBalanceTx.forEach((tx) => {
      if (tx.fromMethod === paymentMethod) {
        items.push({
          id: tx.id,
          type: 'balance_out',
          typeLabel: 'Equilibrio (Salida)',
          description: `Transferencia a ${getMethodLabel(tx.toMethod)}`,
          amountBs: tx.amount,
          icon: ArrowLeftRight,
          isNegative: true,
        });
      }
      if (tx.toMethod === paymentMethod) {
        items.push({
          id: tx.id,
          type: 'balance_in',
          typeLabel: 'Equilibrio (Entrada)',
          description: `Transferencia desde ${getMethodLabel(tx.fromMethod)}`,
          amountBs: tx.amount,
          icon: ArrowLeftRight,
        });
      }
    });

    return items;
  }, [
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    selectedDate,
    paymentMethod,
    currencyConverter,
  ]);

  const totals = useMemo(() => getSummary(transactions), [transactions]);

  const transactionsView = useMemo<TransactionViewItem[]>(() => {
    return transactions.map((transaction) => {
      const tone = mapTransactionTone(transaction.type, methodConfig);
      const amountText = `${tone.prefix}${formatBs(transaction.amountBs)}`;

      return {
        key: `${transaction.type}-${transaction.id}`,
        typeLabel: transaction.typeLabel,
        description: transaction.description,
        amountText,
        amountUsdText: transaction.amountUsd
          ? `$${transaction.amountUsd.toFixed(2)}`
          : undefined,
        icon: transaction.icon,
        containerClass: tone.containerClass,
        iconWrapperClass: tone.iconWrapperClass,
        iconClass: tone.iconClass,
        amountClass: tone.amountClass,
      };
    });
  }, [transactions, methodConfig]);

  const balanceNet = totals.balanceIn - totals.balanceOut;
  const balanceNetClass = balanceNet >= 0 ? 'text-blue-600' : 'text-orange-600';
  const balanceNetText = `${balanceNet >= 0 ? '+' : '-'}${formatBs(
    Math.abs(balanceNet)
  )}`;

  const balanceDetailText =
    totals.balanceIn > 0 || totals.balanceOut > 0
      ? `${
          totals.balanceIn > 0
            ? `+${totals.balanceIn.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
              })} entrada${totals.balanceOut > 0 ? ' / ' : ''}`
            : ''
        }${
          totals.balanceOut > 0
            ? `-${totals.balanceOut.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
              })} salida`
            : ''
        }`
      : undefined;

  const switcherItems = useMemo<SwitcherItem[]>(
    () =>
      PAYMENT_METHOD_ORDER.map((method) => {
        const config = PAYMENT_METHOD_CONFIG[method];
        const isActive = method === paymentMethod;
        return {
          method,
          title: getMethodLabel(method),
          icon: config.icon,
          buttonClass: isActive
            ? `${config.bgClass} ${config.borderClass} border-2`
            : 'bg-gray-100 hover:bg-gray-200',
          iconClass: isActive ? config.colorClass : 'text-gray-500',
        };
      }),
    [paymentMethod]
  );

  const pageTitle = paymentLabel;

  return {
    selectedDate,
    setSelectedDate,
    pageTitle,
    onBackRoute: 'dashboard',
    kpi: {
      title: `Total ${paymentLabel}`,
      valueText: formatBs(totals.net),
      subtitleText: formatUsd(currencyConverter.toUsd(totals.net)),
      icon: methodConfig.icon,
      iconClass: methodConfig.colorClass,
      borderClass: methodConfig.borderClass,
    },
    summary: {
      incomeText: formatBs(totals.income),
      expensesText: formatBs(totals.expenses),
      balanceNetText,
      balanceNetClass,
      balanceDetailText,
      borderClass: methodConfig.borderClass,
    },
    switcherItems,
    transactions: transactionsView,
    transactionsCount: transactionsView.length,
    emptyState: {
      message: `No hay transacciones en ${paymentLabel} para esta fecha`,
      icon: methodConfig.icon,
    },
  };
}
