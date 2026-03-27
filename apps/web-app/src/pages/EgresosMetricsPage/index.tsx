import { useMemo } from 'react';
import { TrendingDown, DollarSign, Hash } from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useConfigStore } from '@/store/useConfigStore';
import type { AppRoute } from '@/types';

interface EgresosMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function EgresosMetricsPage({
  onNavigate,
}: EgresosMetricsPageProps = {}) {
  const { expenses } = useExpenseStore();
  const { config } = useConfigStore();

  const metrics = useMemo(() => {
    const totalExpenses = expenses.length;
    const totalBs = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalUsd = totalBs / config.exchangeRate;

    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      const key = e.category ?? 'Sin categoría';
      acc[key] = (acc[key] ?? 0) + e.amount;
      return acc;
    }, {});

    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalExpenses, totalBs, totalUsd, topCategories };
  }, [expenses, config.exchangeRate]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Egresos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.totalExpenses}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Total USD</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.totalUsd.toFixed(2)}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Total Bs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              Bs {metrics.totalBs.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Por categoría */}
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="font-semibold text-foreground">Top Categorías</h2>
          </div>
          {metrics.topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin registros
            </p>
          ) : (
            <div className="space-y-2">
              {metrics.topCategories.map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-foreground">{category}</span>
                  <span className="text-sm font-semibold text-destructive">
                    Bs {amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
