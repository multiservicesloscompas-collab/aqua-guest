import { useMemo } from 'react';
import { WashingMachine, TrendingUp, DollarSign, Hash } from 'lucide-react';
import { useRentalStore } from '@/store/useRentalStore';
import { useConfigStore } from '@/store/useConfigStore';
import type { AppRoute } from '@/types';

interface LavadorasMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function LavadorasMetricsPage({
  onNavigate,
}: LavadorasMetricsPageProps = {}) {
  const { rentals } = useRentalStore();
  const { config } = useConfigStore();

  const metrics = useMemo(() => {
    const totalRentals = rentals.length;
    const totalUsd = rentals.reduce((sum, r) => sum + r.totalUsd, 0);
    const totalBs = totalUsd * config.exchangeRate;

    const byShift = rentals.reduce<Record<string, number>>((acc, r) => {
      acc[r.shift] = (acc[r.shift] ?? 0) + 1;
      return acc;
    }, {});

    return { totalRentals, totalUsd, totalBs, byShift };
  }, [rentals, config.exchangeRate]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Alquileres</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.totalRentals}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total USD</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.totalUsd.toFixed(2)}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Bs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              Bs {metrics.totalBs.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Por turno */}
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <WashingMachine className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Por Turno</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(metrics.byShift).map(([shift, count]) => (
              <div
                key={shift}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm capitalize text-foreground">
                  {shift}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(metrics.byShift).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin registros
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
