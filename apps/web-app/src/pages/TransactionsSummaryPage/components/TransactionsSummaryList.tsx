import { format } from 'date-fns';
import {
  ArrowRightLeft,
  Calendar,
  Droplets,
  Receipt,
  Wallet,
  WashingMachine,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import {
  buildTransactionsSummaryItems,
  type TransactionType,
} from '../services/buildTransactionsSummaryItems';

type TransactionItem = ReturnType<typeof buildTransactionsSummaryItems>[number];

interface TransactionsSummaryListProps {
  transactions: TransactionItem[];
}

function getIcon(type: TransactionType) {
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
}

export function TransactionsSummaryList({
  transactions,
}: TransactionsSummaryListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No hay transacciones registradas para este día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <Card key={t.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4 gap-3">
              <div
                className={`p-2 rounded-full ${
                  t.type === 'expense' ? 'bg-red-100' : 'bg-blue-50'
                }`}
              >
                {getIcon(t.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{t.title}</p>
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
            <div
              className={`px-4 py-2 bg-muted/30 flex justify-between items-center text-sm font-medium border-t`}
            >
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
  );
}
