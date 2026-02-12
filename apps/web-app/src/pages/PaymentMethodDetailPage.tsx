import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
import { KpiCard } from '@/components/ui/KpiCard';
import { useAppStore } from '@/store/useAppStore';
import {
  PaymentMethod,
  PaymentMethodLabels,
  AppRoute,
} from '@/types';
import {
  ArrowLeft,
  Banknote,
  Smartphone,
  CreditCard,
  DollarSign,
  WashingMachine,
  Receipt,
  Droplets,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCurrencyConverter } from '@/services/CurrencyService';
import { cn } from '@/lib/utils';

interface PaymentMethodDetailPageProps {
  paymentMethod: PaymentMethod;
  onNavigate: (route: AppRoute) => void;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
}

const paymentConfig: Record<
  PaymentMethod,
  { icon: typeof Banknote; color: string; bgColor: string; borderColor: string }
> = {
  efectivo: {
    icon: Banknote,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  pago_movil: {
    icon: Smartphone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  punto_venta: {
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  divisa: {
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
};

interface TransactionItem {
  id: string;
  type: 'sale' | 'rental' | 'expense' | 'prepaid' | 'balance_in' | 'balance_out';
  typeLabel: string;
  description: string;
  amountBs: number;
  amountUsd?: number;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  isNegative?: boolean;
}

export function PaymentMethodDetailPage({
  paymentMethod,
  onNavigate,
  onPaymentMethodChange,
}: PaymentMethodDetailPageProps) {
  const {
    sales,
    rentals,
    expenses,
    prepaidOrders,
    paymentBalanceTransactions,
    selectedDate,
    setSelectedDate,
    config,
  } = useAppStore();

  const currencyConverter = useMemo(
    () => createCurrencyConverter(config.exchangeRate),
    [config.exchangeRate]
  );

  const config_payment = paymentConfig[paymentMethod];
  const PaymentIcon = config_payment.icon;

  // Filtrar transacciones por fecha y método de pago
  const transactions = useMemo(() => {
    const items: TransactionItem[] = [];

    // Ventas de agua
    const daySales = sales.filter(
      (s) => s.date === selectedDate && s.paymentMethod === paymentMethod
    );
    daySales.forEach((sale) => {
      items.push({
        id: sale.id,
        type: 'sale',
        typeLabel: 'Venta de Agua',
        description: `${sale.items.length} producto${sale.items.length > 1 ? 's' : ''}`,
        amountBs: sale.totalBs,
        amountUsd: sale.totalUsd,
        date: sale.date,
        icon: Droplets,
      });
    });

    // Alquileres (filtrados por datePaid, no por date)
    const dayRentals = rentals.filter(
      (r) =>
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
        date: rental.datePaid || rental.date,
        icon: WashingMachine,
      });
    });

    // Egresos
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
        date: expense.date,
        icon: Receipt,
      });
    });

    // Prepagados
    const dayPrepaid = prepaidOrders.filter(
      (p) =>
        p.datePaid === selectedDate && p.paymentMethod === paymentMethod
    );
    dayPrepaid.forEach((prepaid) => {
      items.push({
        id: prepaid.id,
        type: 'prepaid',
        typeLabel: 'Agua Prepagada',
        description: `${prepaid.customerName} - ${prepaid.liters}L`,
        amountBs: prepaid.amountBs,
        amountUsd: prepaid.amountUsd,
        date: prepaid.datePaid,
        icon: Droplets,
      });
    });

    // Equilibrios de pago (transferencias entre métodos)
    const dayBalanceTx = paymentBalanceTransactions.filter(
      (t) => t.date === selectedDate
    );
    
    dayBalanceTx.forEach((tx) => {
      if (tx.fromMethod === paymentMethod) {
        // Salida de dinero (se transfirió DESDE este método)
        items.push({
          id: tx.id,
          type: 'balance_out',
          typeLabel: 'Equilibrio (Salida)',
          description: `Transferencia a ${tx.toMethod === 'efectivo' ? 'Efectivo' : tx.toMethod === 'pago_movil' ? 'Pago Móvil' : tx.toMethod === 'punto_venta' ? 'Punto de Venta' : 'Divisa'}`,
          amountBs: tx.amount,
          date: tx.date,
          icon: ArrowLeftRight,
          isNegative: true,
        });
      }
      if (tx.toMethod === paymentMethod) {
        // Entrada de dinero (se transfirió A este método)
        items.push({
          id: tx.id,
          type: 'balance_in',
          typeLabel: 'Equilibrio (Entrada)',
          description: `Transferencia desde ${tx.fromMethod === 'efectivo' ? 'Efectivo' : tx.fromMethod === 'pago_movil' ? 'Pago Móvil' : tx.fromMethod === 'punto_venta' ? 'Punto de Venta' : 'Divisa'}`,
          amountBs: tx.amount,
          date: tx.date,
          icon: ArrowLeftRight,
          isNegative: false,
        });
      }
    });

    // Ordenar por fecha/hora (si está disponible)
    return items;
  }, [sales, rentals, expenses, prepaidOrders, paymentBalanceTransactions, selectedDate, paymentMethod, currencyConverter]);

  // Calcular totales
  const totals = useMemo(() => {
    // Ingresos por operaciones normales (ventas, alquileres, prepagados)
    const income = transactions
      .filter((t) => ['sale', 'rental', 'prepaid'].includes(t.type))
      .reduce((sum, t) => sum + t.amountBs, 0);
    
    // Egresos
    const expenses_total = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountBs, 0);
    
    // Equilibrios (entradas positivas, salidas negativas)
    const balance_in = transactions
      .filter((t) => t.type === 'balance_in')
      .reduce((sum, t) => sum + t.amountBs, 0);
    const balance_out = transactions
      .filter((t) => t.type === 'balance_out')
      .reduce((sum, t) => sum + t.amountBs, 0);
    
    // Total neto = ingresos - egresos + equilibrios_entrada - equilibrios_salida
    const net = income - expenses_total + balance_in - balance_out;

    return { 
      income, 
      expenses: expenses_total, 
      balance_in,
      balance_out,
      net 
    };
  }, [transactions]);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title={PaymentMethodLabels[paymentMethod]}
        subtitle="Detalle de Transacciones"
        leftAction={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de fecha global */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={false}
        />

        {/* Card de total */}
        <KpiCard
          title={`Total ${PaymentMethodLabels[paymentMethod]}`}
          value={`Bs ${totals.net.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`$${currencyConverter.toUsd(totals.net).toFixed(2)} USD`}
          icon={<PaymentIcon className={cn('w-5 h-5', config_payment.color)} />}
          variant="primary"
          className={cn('border-2', config_payment.borderColor)}
        />

        {/* Resumen de ingresos, egresos, equilibrios y selector de método */}
        <div className="grid grid-cols-2 gap-3">
          <Card className={cn('border', config_payment.borderColor)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Ingresos Operativos</p>
              <p className="text-lg font-bold text-green-600">
                Bs{' '}
                {totals.income.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
          <Card className={cn('border', config_payment.borderColor)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Egresos</p>
              <p className="text-lg font-bold text-destructive">
                Bs{' '}
                {totals.expenses.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
          <Card className={cn('border', config_payment.borderColor)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Equilibrios Netos</p>
              <p className={cn(
                'text-lg font-bold',
                totals.balance_in - totals.balance_out >= 0 ? 'text-blue-600' : 'text-orange-600'
              )}>
                {totals.balance_in - totals.balance_out >= 0 ? '+' : '-'}
                Bs{' '}
                {Math.abs(totals.balance_in - totals.balance_out).toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                })}
              </p>
              {(totals.balance_in > 0 || totals.balance_out > 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.balance_in > 0 && `+${totals.balance_in.toLocaleString('es-VE', { minimumFractionDigits: 2 })} entrada${totals.balance_out > 0 ? ' / ' : ''}`}
                  {totals.balance_out > 0 && `-${totals.balance_out.toLocaleString('es-VE', { minimumFractionDigits: 2 })} salida`}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Cambiar Método</p>
              <div className="flex gap-1">
                {(Object.keys(paymentConfig) as PaymentMethod[]).map((method) => {
                  const MethodIcon = paymentConfig[method].icon;
                  const isActive = method === paymentMethod;
                  return (
                    <button
                      key={method}
                      onClick={() => onPaymentMethodChange?.(method)}
                      className={cn(
                        'p-2 rounded-lg transition-all flex-1 flex justify-center items-center',
                        isActive
                          ? cn(paymentConfig[method].bgColor, paymentConfig[method].borderColor, 'border-2')
                          : 'bg-gray-100 hover:bg-gray-200'
                      )}
                      title={PaymentMethodLabels[method]}
                    >
                      <MethodIcon
                        className={cn(
                          'w-4 h-4',
                          isActive ? paymentConfig[method].color : 'text-gray-500'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de transacciones */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              Transacciones ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PaymentIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  No hay transacciones en{' '}
                  {PaymentMethodLabels[paymentMethod]} para esta fecha
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const TypeIcon = transaction.icon;
                  const isExpense = transaction.type === 'expense';
                  const isBalanceOut = transaction.type === 'balance_out';
                  const isNegative = isExpense || isBalanceOut;

                  return (
                    <div
                      key={`${transaction.type}-${transaction.id}`}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        isNegative
                          ? 'bg-red-50/50 border-red-100'
                          : transaction.type === 'balance_in'
                          ? 'bg-blue-50/50 border-blue-100'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isNegative
                              ? 'bg-red-100 text-red-600'
                              : transaction.type === 'balance_in'
                              ? 'bg-blue-100 text-blue-600'
                              : config_payment.bgColor
                          )}
                        >
                          <TypeIcon
                            className={cn(
                              'w-4 h-4',
                              isNegative
                                ? 'text-red-600'
                                : transaction.type === 'balance_in'
                                ? 'text-blue-600'
                                : config_payment.color
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {transaction.typeLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-bold',
                            isNegative
                              ? 'text-red-600'
                              : transaction.type === 'balance_in'
                              ? 'text-blue-600'
                              : 'text-foreground'
                          )}
                        >
                          {isNegative ? '-' : transaction.type === 'balance_in' ? '+' : ''}Bs{' '}
                          {transaction.amountBs.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {transaction.amountUsd && (
                          <p className="text-xs text-muted-foreground">
                            ${transaction.amountUsd.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
