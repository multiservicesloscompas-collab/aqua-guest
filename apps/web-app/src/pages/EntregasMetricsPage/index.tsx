import { useMemo } from 'react';
import { Truck, DollarSign, Hash, TrendingUp } from 'lucide-react';
import { useRentalStore } from '@/store/useRentalStore';
import { useConfigStore } from '@/store/useConfigStore';
import type { AppRoute } from '@/types';

interface EntregasMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function EntregasMetricsPage({
  onNavigate,
}: EntregasMetricsPageProps = {}) {
  const { rentals } = useRentalStore();
  const { config } = useConfigStore();

  const metrics = useMemo(() => {
    const withDelivery = rentals.filter((r) => r.deliveryFee > 0);
    const totalDeliveries = withDelivery.length;
    const totalFeeUsd = withDelivery.reduce(
      (sum, r) => sum + (r.deliveryFee ?? 0),
      0
    );
    const totalFeeBs = totalFeeUsd * config.exchangeRate;

    const byStatus = withDelivery.reduce<Record<string, number>>((acc, r) => {
      const key = r.status ?? 'pendiente';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return { totalDeliveries, totalFeeUsd, totalFeeBs, byStatus };
  }, [rentals, config.exchangeRate]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Entregas</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.totalDeliveries}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Flete USD</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.totalFeeUsd.toFixed(2)}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Flete Bs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              Bs {metrics.totalFeeBs.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Por estado */}
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Por Estado</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(metrics.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm capitalize text-foreground">
                  {status}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(metrics.byStatus).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin entregas registradas
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
