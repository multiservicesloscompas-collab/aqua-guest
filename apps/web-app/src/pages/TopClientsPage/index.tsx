import { useMemo } from 'react';
import { Trophy, DollarSign } from 'lucide-react';
import { useRentalStore } from '@/store/useRentalStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import type { AppRoute } from '@/types';

interface TopClientsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function TopClientsPage({ onNavigate }: TopClientsPageProps = {}) {
  const { rentals } = useRentalStore();
  const { customers } = useCustomerStore();

  const topClients = useMemo(() => {
    const totals: Record<
      string,
      { name: string; totalUsd: number; count: number }
    > = {};

    for (const rental of rentals) {
      const id = rental.customerId ?? `anon-${rental.customerName}`;
      if (!totals[id]) {
        totals[id] = { name: rental.customerName, totalUsd: 0, count: 0 };
      }
      totals[id].totalUsd += rental.totalUsd;
      totals[id].count += 1;
    }

    // Enrich with full customer name if available
    for (const customer of customers) {
      if (totals[customer.id]) {
        totals[customer.id].name = customer.name;
      }
    }

    return Object.entries(totals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 20);
  }, [rentals, customers]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Top 20 Clientes</h2>
          </div>

          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin datos disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {topClients.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.count} alquiler{client.count !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-sm font-bold">
                      {client.totalUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
