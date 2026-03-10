import { ComponentType, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { usePrepaidStore } from '@/store/usePrepaidStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useRentalStore } from '@/store/useRentalStore';
import { createCurrencyConverter } from '@/services/CurrencyService';
import { AppRoute, PaymentMethod, PaymentMethodLabels } from '@/types';
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_ORDER,
} from '../services/paymentMethodDetailConfig';
import {
  buildPaymentMethodTransactions,
  type PaymentMethodDetailTransactionItem,
  summarizePaymentMethodTransactions,
} from '../services/paymentMethodDetailTransactions';

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
  type: PaymentMethodDetailTransactionItem['type'];
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
    return buildPaymentMethodTransactions({
      paymentMethod,
      selectedDate,
      exchangeRate: config.exchangeRate,
      sales,
      rentals,
      expenses,
      prepaidOrders,
      paymentBalanceTransactions,
      getMethodLabel,
    });
  }, [
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    selectedDate,
    paymentMethod,
    config.exchangeRate,
  ]);

  const totals = useMemo(
    () => summarizePaymentMethodTransactions(transactions),
    [transactions]
  );

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
