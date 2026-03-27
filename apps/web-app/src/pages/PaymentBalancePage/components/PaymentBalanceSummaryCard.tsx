import { ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentBalanceSummary, PaymentMethodLabels } from '@/types';

interface PaymentBalanceSummaryCardProps {
  summaries: PaymentBalanceSummary[];
  selectedDate: string;
  exchangeRate: number;
  getMethodIcon: (method: PaymentBalanceSummary['method']) => string;
  getMethodColor: (method: PaymentBalanceSummary['method']) => string;
}

export function PaymentBalanceSummaryCard({
  summaries,
  selectedDate,
  exchangeRate,
  getMethodIcon,
  getMethodColor,
}: PaymentBalanceSummaryCardProps) {
  const formatMethodAmount = (
    method: PaymentBalanceSummary['method'],
    value: number
  ) =>
    method === 'divisa'
      ? `$${(value / exchangeRate).toFixed(2)}`
      : `Bs ${value.toFixed(2)}`;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          Resumen de Balances ({selectedDate})
        </h3>

        <div className="space-y-3">
          {summaries.map((summary) => (
            <div
              key={summary.method}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getMethodIcon(summary.method)}
                </span>
                <div>
                  <p className="font-medium">
                    {PaymentMethodLabels[summary.method]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Original:{' '}
                    {formatMethodAmount(summary.method, summary.originalTotal)}
                  </p>
                  {summary.adjustments !== 0 && (
                    <p className="text-xs">
                      <span
                        className={
                          summary.adjustments > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        Ajuste: {summary.adjustments > 0 ? '+' : ''}
                        {formatMethodAmount(
                          summary.method,
                          summary.adjustments
                        )}
                      </span>
                    </p>
                  )}
                  {summary.adjustments === 0 && (
                    <p className="text-xs text-muted-foreground">Ajuste: 0</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  {formatMethodAmount(summary.method, summary.finalTotal)}
                </p>
                <Badge
                  variant="outline"
                  className={getMethodColor(summary.method)}
                >
                  {summary.method === 'divisa' ? 'USD' : 'Bs'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
