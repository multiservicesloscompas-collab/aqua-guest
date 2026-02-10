import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Droplets,
    WashingMachine,
    Wallet,
    Receipt,
    ArrowRightLeft,
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppRoute, PaymentMethodLabels } from '@/types';

interface TransactionsSummaryPageProps {
    onNavigate?: (route: AppRoute) => void;
}

type TransactionType =
    | 'sale'
    | 'rental'
    | 'expense'
    | 'prepaid'
    | 'balance_transfer';

interface TransactionItem {
    id: string;
    type: TransactionType;
    title: string;
    subtitle?: string;
    amountBs: number;
    amountUsd?: number;
    isIncome: boolean; // true = income (green), false = expense (red), null = neutral (blue)
    paymentMethod?: string;
    timestamp: string; // for sorting
    originalDate: string; // the business date
}

export function TransactionsSummaryPage({
    onNavigate,
}: TransactionsSummaryPageProps = {}) {
    const {
        sales,
        rentals,
        expenses,
        prepaidOrders,
        paymentBalanceTransactions,
        selectedDate,
        config,
    } = useAppStore();

    const transactions = useMemo(() => {
        const items: TransactionItem[] = [];

        // 1. Ventas de Agua
        sales
            .filter((s: import('@/types').Sale) => s.date === selectedDate)
            .forEach((s: import('@/types').Sale) => {
                items.push({
                    id: s.id,
                    type: 'sale',
                    title: `Venta de Agua #${s.dailyNumber}`,
                    subtitle: `${s.items.length} items`,
                    amountBs: s.totalBs,
                    amountUsd: s.totalUsd,
                    isIncome: true,
                    paymentMethod: PaymentMethodLabels[s.paymentMethod],
                    timestamp: s.createdAt,
                    originalDate: s.date,
                });
            });

        // 2. Alquileres de Lavadora (Pagados)
        rentals
            .filter((r: import('@/types').WasherRental) => r.isPaid && (r.datePaid || r.date) === selectedDate)
            .forEach((r: import('@/types').WasherRental) => {
                items.push({
                    id: r.id,
                    type: 'rental',
                    title: 'Alquiler de Lavadora',
                    subtitle: r.customerName || 'Cliente Eventual',
                    amountBs: r.totalUsd * config.exchangeRate, // Aproximado si pagó en Bs
                    amountUsd: r.totalUsd,
                    isIncome: true,
                    paymentMethod: PaymentMethodLabels[r.paymentMethod],
                    timestamp: r.updatedAt || r.createdAt, // Payment likely happened on update
                    originalDate: r.datePaid || r.date,
                });
            });

        // 3. Egresos
        expenses
            .filter((e: import('@/types').Expense) => e.date === selectedDate)
            .forEach((e: import('@/types').Expense) => {
                items.push({
                    id: e.id,
                    type: 'expense',
                    title: e.category.charAt(0).toUpperCase() + e.category.slice(1),
                    subtitle: e.description,
                    amountBs: e.amount,
                    amountUsd: e.amount / config.exchangeRate,
                    isIncome: false,
                    paymentMethod: PaymentMethodLabels[e.paymentMethod],
                    timestamp: e.createdAt,
                    originalDate: e.date,
                });
            });

        // 4. Pedidos Prepagados (Pagados hoy)
        prepaidOrders
            .filter((p: import('@/types').PrepaidOrder) => p.datePaid === selectedDate && p.amountBs > 0)
            .forEach((p: import('@/types').PrepaidOrder) => {
                items.push({
                    id: p.id,
                    type: 'prepaid',
                    title: 'Recarga Prepagada',
                    subtitle: p.customerName,
                    amountBs: p.amountBs,
                    amountUsd: p.amountUsd,
                    isIncome: true,
                    paymentMethod: PaymentMethodLabels[p.paymentMethod],
                    timestamp: p.createdAt, // Might need payment timestamp if available separately
                    originalDate: p.datePaid,
                });
            });

        // 5. Transferencias de Balance
        paymentBalanceTransactions
            .filter((t: import('@/types').PaymentBalanceTransaction) => t.date === selectedDate)
            .forEach((t: import('@/types').PaymentBalanceTransaction) => {
                items.push({
                    id: t.id,
                    type: 'balance_transfer',
                    title: 'Ajuste de Caja',
                    subtitle: `${PaymentMethodLabels[t.fromMethod]} ➔ ${PaymentMethodLabels[t.toMethod]
                        }`,
                    amountBs: t.amountBs || t.amount,
                    amountUsd: t.amountUsd,
                    isIncome: true, // Neutral, but shown as info
                    paymentMethod: 'Transferencia',
                    timestamp: t.createdAt,
                    originalDate: t.date,
                });
            });

        // Sort by timestamp descending (newest first)
        return items.sort(
            (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [
        sales,
        rentals,
        expenses,
        prepaidOrders,
        paymentBalanceTransactions,
        selectedDate,
        config.exchangeRate,
    ]);

    const totalIncome = transactions
        .filter((t) => t.type !== 'expense' && t.type !== 'balance_transfer')
        .reduce((sum, t) => sum + t.amountBs, 0);

    const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountBs, 0);

    const getIcon = (type: TransactionType) => {
        switch (type) {
            case 'sale':
                return <Droplets className="w-5 h-5 text-blue-500" />;
            case 'rental':
                return <WashingMachine className="w-5 h-5 text-purple-500" />;
            case 'expense':
                return <Wallet className="w-5 h-5 text-red-500" />;
            case 'prepaid':
                return <Receipt className="w-5 h-5 text-green-500" />;
            case 'balance_transfer':
                return <ArrowRightLeft className="w-5 h-5 text-orange-500" />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            <Header
                title="Transacciones"
                subtitle={format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", {
                    locale: es,
                })}
                showBack
                onBack={() => onNavigate?.('dashboard')}
            />

            <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
                {/* Resumen Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <p className="text-xs text-green-600 font-medium uppercase">
                                Ingresos
                            </p>
                            <p className="text-xl font-bold text-green-700">
                                Bs {totalIncome.toLocaleString('es-VE')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4">
                            <p className="text-xs text-red-600 font-medium uppercase">
                                Egresos
                            </p>
                            <p className="text-xl font-bold text-red-700">
                                Bs {totalExpenses.toLocaleString('es-VE')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay transacciones registradas para este día.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => (
                            <Card key={t.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-4 gap-3">
                                        <div
                                            className={`p-2 rounded-full ${t.type === 'expense' ? 'bg-red-100' : 'bg-blue-50'
                                                }`}
                                        >
                                            {getIcon(t.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm truncate">
                                                    {t.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {format(new Date(t.timestamp), 'h:mm a')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <p>{t.subtitle}</p>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0 h-5"
                                                >
                                                    {t.paymentMethod}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 bg-muted/30 flex justify-between items-center text-sm font-medium border-t`}>
                                        <span className="text-muted-foreground">Monto</span>
                                        <span
                                            className={
                                                t.type === 'expense'
                                                    ? 'text-red-600'
                                                    : t.type === 'balance_transfer'
                                                        ? 'text-orange-600'
                                                        : 'text-green-600'
                                            }
                                        >
                                            {t.type === 'expense' ? '-' : '+'} Bs{' '}
                                            {t.amountBs.toLocaleString('es-VE', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            {t.amountUsd && (
                                                <span className="text-xs text-muted-foreground ml-1 font-normal">
                                                    (${t.amountUsd.toFixed(2)})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
