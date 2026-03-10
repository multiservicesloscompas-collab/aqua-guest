import { useMemo } from 'react';
import { Users, Hash } from 'lucide-react';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import type { AppRoute } from '@/types';

interface ClientesMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function ClientesMetricsPage({
  onNavigate,
}: ClientesMetricsPageProps = {}) {
  const { customers } = useCustomerStore();
  const { rentals } = useRentalStore();

  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    // Clientes que aparecen en alquileres
    const activeCustomerIds = new Set(
      rentals.map((r) => r.customerId).filter((id): id is string => !!id)
    );
    const activeCustomers = activeCustomerIds.size;

    return { totalCustomers, activeCustomers };
  }, [customers, rentals]);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.totalCustomers}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Activos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.activeCustomers}
            </p>
          </div>
        </div>

        {/* Listado rápido */}
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Base de clientes</h2>
          </div>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin clientes registrados
            </p>
          ) : (
            <div className="space-y-2">
              {customers.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-foreground font-medium">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.phone}
                  </span>
                </div>
              ))}
              {customers.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{customers.length - 10} más
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
