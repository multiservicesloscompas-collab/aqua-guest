import { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';

interface SummaryItem {
  incomeText: string;
  expensesText: string;
  balanceNetText: string;
  balanceNetClass: string;
  balanceDetailText?: string;
  borderClass: string;
}

interface SwitcherItem {
  method: PaymentMethod;
  title: string;
  icon: ComponentType<{ className?: string }>;
  buttonClass: string;
  iconClass: string;
}

interface PaymentMethodSummaryGridProps {
  summary: SummaryItem;
  switcherItems: SwitcherItem[];
  onPaymentMethodChange?: (method: PaymentMethod) => void;
}

export function PaymentMethodSummaryGrid({
  summary,
  switcherItems,
  onPaymentMethodChange,
}: PaymentMethodSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className={cn('border', summary.borderClass)}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Ingresos Operativos
          </p>
          <p className="text-lg font-bold text-green-600">
            {summary.incomeText}
          </p>
        </CardContent>
      </Card>
      <Card className={cn('border', summary.borderClass)}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Egresos</p>
          <p className="text-lg font-bold text-destructive">
            {summary.expensesText}
          </p>
        </CardContent>
      </Card>
      <Card className={cn('border', summary.borderClass)}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Equilibrios Netos
          </p>
          <p className={cn('text-lg font-bold', summary.balanceNetClass)}>
            {summary.balanceNetText}
          </p>
          {summary.balanceDetailText ? (
            <p className="text-xs text-muted-foreground mt-1">
              {summary.balanceDetailText}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Cambiar Método</p>
          <div className="flex gap-1">
            {switcherItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.method}
                  onClick={() => onPaymentMethodChange?.(item.method)}
                  className={cn(
                    'p-2 rounded-lg transition-all flex-1 flex justify-center items-center',
                    item.buttonClass
                  )}
                  title={item.title}
                >
                  <Icon className={cn('w-4 h-4', item.iconClass)} />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
