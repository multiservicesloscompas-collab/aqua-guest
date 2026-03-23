import { ComponentType } from 'react';
import { Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransactionViewItem {
  key: string;
  typeLabel: string;
  description: string;
  linkedReference: string;
  amountText: string;
  amountUsdText?: string;
  paymentMethodLabel?: string;
  icon: ComponentType<{ className?: string }>;
  containerClass: string;
  iconWrapperClass: string;
  iconClass: string;
  amountClass: string;
}

interface PaymentMethodTransactionsCardProps {
  count: number;
  items: TransactionViewItem[];
  emptyMessage: string;
  emptyIcon: ComponentType<{ className?: string }>;
}

export function PaymentMethodTransactionsCard({
  count,
  items,
  emptyMessage,
  emptyIcon: EmptyIcon,
}: PaymentMethodTransactionsCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          Transacciones ({count})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <EmptyIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((transaction) => {
              const TypeIcon = transaction.icon;
              return (
                <div
                  key={transaction.key}
                  className={`flex items-center justify-between p-3 rounded-lg border ${transaction.containerClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${transaction.iconWrapperClass}`}
                    >
                      <TypeIcon
                        className={`w-4 h-4 ${transaction.iconClass}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground">
                          {transaction.typeLabel}
                        </p>
                        {transaction.paymentMethodLabel ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {transaction.paymentMethodLabel}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground/90">
                        {transaction.linkedReference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${transaction.amountClass}`}
                    >
                      {transaction.amountText}
                    </p>
                    {transaction.amountUsdText ? (
                      <p className="text-xs text-muted-foreground">
                        {transaction.amountUsdText}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
