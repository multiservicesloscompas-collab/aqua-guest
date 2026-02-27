import { useMemo } from 'react';
import { Banknote, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import {
  Expense,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';
import { calculateDashboardMetrics } from '@/services/DashboardMetricsService';
import { useWeekData } from '@/hooks/useWeekData';
import { createCurrencyConverter } from '@/services/CurrencyService';

interface DashboardViewModelInput {
  selectedDate: string;
  exchangeRate: number;
  sales: Sale[];
  rentals: WasherRental[];
  expenses: Expense[];
  prepaidOrders: PrepaidOrder[];
  paymentBalanceTransactions: PaymentBalanceTransaction[];
  currency: 'Bs' | 'USD';
}

function formatBs(amount: number) {
  return `Bs ${amount.toFixed(0)}`;
}

function formatUsd(amount: number) {
  return `$ ${amount.toFixed(2)}`;
}

function formatLocale(amount: number) {
  return amount.toLocaleString('es-VE', { minimumFractionDigits: 2 });
}

export function useDashboardViewModel({
  selectedDate,
  exchangeRate,
  sales,
  rentals,
  expenses,
  prepaidOrders,
  paymentBalanceTransactions,
  currency,
}: DashboardViewModelInput) {
  const metrics = useMemo(
    () =>
      calculateDashboardMetrics({
        selectedDate,
        exchangeRate,
        sales,
        rentals,
        expenses,
        prepaidOrders,
        paymentBalanceTransactions,
      }),
    [
      selectedDate,
      exchangeRate,
      sales,
      rentals,
      expenses,
      prepaidOrders,
      paymentBalanceTransactions,
    ]
  );

  const weekData = useWeekData({
    selectedDate,
    exchangeRate,
    sales,
    rentals,
  });

  const currencyConverter = useMemo(
    () => createCurrencyConverter(exchangeRate),
    [exchangeRate]
  );

  const selectedSales = useMemo(
    () => sales.filter((sale) => sale.date === selectedDate),
    [sales, selectedDate]
  );

  const activeIndex = useMemo(
    () => new Date(selectedDate + 'T12:00:00').getDay(),
    [selectedDate]
  );

  const kpiValues = useMemo(() => {
    const mtdIncomeText =
      currency === 'Bs'
        ? formatBs(metrics.mtd.totalIncomeBs)
        : formatUsd(currencyConverter.toUsd(metrics.mtd.totalIncomeBs));
    const mtdNetText =
      currency === 'Bs'
        ? formatBs(metrics.mtd.netBs)
        : formatUsd(currencyConverter.toUsd(metrics.mtd.netBs));
    const dayExpenseText =
      currency === 'Bs'
        ? formatBs(metrics.day.expenseBs)
        : formatUsd(currencyConverter.toUsd(metrics.day.expenseBs));
    const dayNetText =
      currency === 'Bs'
        ? formatBs(metrics.day.netBs)
        : formatUsd(currencyConverter.toUsd(metrics.day.netBs));

    return {
      mtdIncomeText,
      mtdNetText,
      mtdNetSubtitle: metrics.mtd.netBs >= 0 ? 'Ganancia' : 'Pérdida',
      mtdNetVariant:
        metrics.mtd.netBs >= 0 ? ('default' as const) : ('warning' as const),
      dayExpenseText,
      dayNetText,
      dayNetSubtitle: metrics.day.netBs >= 0 ? 'Ganancia' : 'Pérdida',
      dayNetVariant:
        metrics.day.netBs >= 0 ? ('success' as const) : ('warning' as const),
      dayTransactions: metrics.day.transactionsCount,
    };
  }, [currency, currencyConverter, metrics.day, metrics.mtd]);

  const kpiPrimary = useMemo(
    () => ({
      title: 'Ingresos del Día',
      value: `Bs ${metrics.day.totalIncomeBs.toFixed(2)}`,
      subtitle: `$${currencyConverter
        .toUsd(metrics.day.totalIncomeBs)
        .toFixed(2)} USD`,
    }),
    [currencyConverter, metrics.day.totalIncomeBs]
  );

  const paymentMethodItems = useMemo(
    () => [
      {
        id: 'efectivo' as PaymentMethod,
        title: 'Efectivo',
        amountText:
          currency === 'Bs'
            ? `Bs ${formatLocale(metrics.day.methodTotalsBs.efectivo)}`
            : `$ ${formatLocale(
                currencyConverter.toUsd(metrics.day.methodTotalsBs.efectivo)
              )}`,
        convertedText:
          currency === 'Bs'
            ? `$${currencyConverter
                .toUsd(metrics.day.methodTotalsBs.efectivo)
                .toFixed(2)}`
            : `Bs ${metrics.day.methodTotalsBs.efectivo.toFixed(2)}`,
        accent: {
          background: 'bg-orange-500/5',
          border: 'border border-orange-500/10',
          icon: 'bg-orange-500/10 text-orange-600',
          title: 'text-orange-600/70',
          value: 'text-orange-950',
        },
        icon: Banknote,
      },
      {
        id: 'pago_movil' as PaymentMethod,
        title: 'Pago Móvil',
        amountText:
          currency === 'Bs'
            ? `Bs ${formatLocale(metrics.day.methodTotalsBs.pago_movil)}`
            : `$ ${formatLocale(
                currencyConverter.toUsd(metrics.day.methodTotalsBs.pago_movil)
              )}`,
        convertedText:
          currency === 'Bs'
            ? `$${currencyConverter
                .toUsd(metrics.day.methodTotalsBs.pago_movil)
                .toFixed(2)}`
            : `Bs ${metrics.day.methodTotalsBs.pago_movil.toFixed(2)}`,
        accent: {
          background: 'bg-blue-500/5',
          border: 'border border-blue-500/10',
          icon: 'bg-blue-500/10 text-blue-600',
          title: 'text-blue-600/70',
          value: 'text-blue-950',
        },
        icon: Smartphone,
      },
      {
        id: 'punto_venta' as PaymentMethod,
        title: 'Punto de Venta',
        amountText:
          currency === 'Bs'
            ? `Bs ${formatLocale(metrics.day.methodTotalsBs.punto_venta)}`
            : `$ ${formatLocale(
                currencyConverter.toUsd(metrics.day.methodTotalsBs.punto_venta)
              )}`,
        convertedText:
          currency === 'Bs'
            ? `$${currencyConverter
                .toUsd(metrics.day.methodTotalsBs.punto_venta)
                .toFixed(2)}`
            : `Bs ${metrics.day.methodTotalsBs.punto_venta.toFixed(2)}`,
        accent: {
          background: 'bg-purple-500/5',
          border: 'border border-purple-500/10',
          icon: 'bg-purple-500/10 text-purple-600',
          title: 'text-purple-600/70',
          value: 'text-purple-950',
        },
        icon: CreditCard,
      },
      {
        id: 'divisa' as PaymentMethod,
        title: 'Divisa',
        amountText:
          currency === 'Bs'
            ? `Bs ${formatLocale(metrics.day.methodTotalsBs.divisa)}`
            : `$ ${formatLocale(
                currencyConverter.toUsd(metrics.day.methodTotalsBs.divisa)
              )}`,
        convertedText:
          currency === 'Bs'
            ? `$${currencyConverter
                .toUsd(metrics.day.methodTotalsBs.divisa)
                .toFixed(2)}`
            : `Bs ${metrics.day.methodTotalsBs.divisa.toFixed(2)}`,
        accent: {
          background: 'bg-green-500/5',
          border: 'border border-green-500/10',
          icon: 'bg-green-500/10 text-green-600',
          title: 'text-green-600/70',
          value: 'text-green-950',
        },
        icon: DollarSign,
      },
    ],
    [currency, currencyConverter, metrics.day.methodTotalsBs]
  );

  const currencyLabel = currency === 'Bs' ? 'Bolívares' : 'Dólares';

  return {
    metrics,
    weekData,
    selectedSales,
    activeIndex,
    kpiValues,
    kpiPrimary,
    paymentMethodItems,
    currencyLabel,
  };
}
