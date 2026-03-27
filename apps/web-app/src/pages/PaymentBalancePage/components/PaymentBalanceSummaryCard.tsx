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
    <Card className="shadow-sm border-border bg-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            Resumen de Balances ({selectedDate})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summaries.map((summary) => (
            <div
              key={summary.method}
              className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/50 transition-all hover:bg-muted/60"
            >
              <div className="flex items-center gap-3 w-full">
                {/* Ícono Metodo Pago */}
                <div className="flex-shrink-0 p-2.5 bg-primary/10 text-primary rounded-full">
                  <span className="text-xl">
                    {getMethodIcon(summary.method)}
                  </span>
                </div>
                
                {/* Detalles de Totales y Ajuste */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                    {PaymentMethodLabels[summary.method]}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      Original:{' '}
                      <span className="font-medium">
                        {formatMethodAmount(summary.method, summary.originalTotal)}
                      </span>
                    </p>
                    {summary.adjustments !== 0 ? (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5 ${
                          summary.adjustments > 0
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {summary.adjustments > 0 ? '+' : ''}
                        {formatMethodAmount(summary.method, summary.adjustments)}
                      </Badge>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-muted-foreground/50 hidden sm:inline-block">
                        • Sin ajustes
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Final */}
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-bold text-base sm:text-lg text-foreground tracking-tight">
                    {formatMethodAmount(summary.method, summary.finalTotal)}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] px-1.5 py-0 h-4 border-muted-foreground/20 font-medium ${getMethodColor(
                      summary.method
                    )}`}
                  >
                    {summary.method === 'divisa' ? 'USD' : 'Bs'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
