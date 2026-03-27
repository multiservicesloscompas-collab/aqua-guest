import { Droplets, DollarSign, TrendingUp, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WaterMetrics } from '../hooks/useWaterMetricsViewModel';

interface WaterMetricsKpiCardsProps {
  metrics: WaterMetrics;
}

export function WaterMetricsKpiCards({ metrics }: WaterMetricsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Litros Totales
            </span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {metrics.totalLiters.toLocaleString('es-VE', {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">L</p>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">
              Botellones Eq.
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.equivalentBottles.toLocaleString('es-VE', {
              maximumFractionDigits: 1,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">(÷ 19 litros)</p>
        </CardContent>
      </Card>

      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">
              Total en Bs
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            Bs{' '}
            {metrics.totalBs.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">
              Total en USD
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            ${' '}
            {metrics.totalUsd.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
