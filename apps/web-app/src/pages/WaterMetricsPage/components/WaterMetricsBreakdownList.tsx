import { BarChart3, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfigStore } from '@/store/useConfigStore';
import { LiterBreakdown } from '../hooks/useWaterMetricsViewModel';

interface WaterMetricsBreakdownListProps {
  breakdown: LiterBreakdown[];
  salesCount: number;
  totalLiters: number;
}

export function WaterMetricsBreakdownList({
  breakdown,
  salesCount,
  totalLiters,
}: WaterMetricsBreakdownListProps) {
  const { config } = useConfigStore();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            Desglose por Cantidad de Litros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Droplets className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                No hay ventas con litros en este período
              </p>
            </div>
          ) : (
            breakdown.map((item) => (
              <div
                key={item.liters}
                className="bg-muted/50 rounded-lg p-4 border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {item.liters}L
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {item.count} {item.count === 1 ? 'venta' : 'ventas'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalLiters.toLocaleString('es-VE', {
                          maximumFractionDigits: 0,
                        })}{' '}
                        litros totales
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      Bs{' '}
                      {item.totalBs.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      $
                      {(item.totalBs / config.exchangeRate).toLocaleString(
                        'es-VE',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total de ventas:
            </span>
            <span className="text-lg font-bold text-foreground">
              {salesCount}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground">
              Promedio por venta:
            </span>
            <span className="text-lg font-bold text-foreground">
              {salesCount > 0
                ? (totalLiters / salesCount).toLocaleString('es-VE', {
                    maximumFractionDigits: 1,
                  })
                : '0'}{' '}
              L
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
