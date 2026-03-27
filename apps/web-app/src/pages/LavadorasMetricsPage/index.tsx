import { useState, useMemo, useEffect } from 'react';
import {
  WashingMachine as MachineIcon,
  TrendingUp,
  DollarSign,
  Hash,
  Activity,
} from 'lucide-react';
import { useRentalStore } from '@/store/useRentalStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useAppStore } from '@/store/useAppStore';
import { DateSelector } from '@/components/ventas/DateSelector';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppRoute } from '@/types';

interface LavadorasMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

type ViewMode = 'dia' | 'semana' | 'mes';

export function LavadorasMetricsPage({
  onNavigate,
}: LavadorasMetricsPageProps = {}) {
  const { rentals, loadRentalsByDateRange } = useRentalStore();
  const { washingMachines, loadWashingMachines } = useMachineStore();
  const { config } = useConfigStore();
  const { selectedDate, setSelectedDate } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [loading, setLoading] = useState(false);

  // Asegurar que las lavadoras estén cargadas
  useEffect(() => {
    loadWashingMachines();
  }, [loadWashingMachines]);

  // Cargar datos cuando cambia la fecha o el modo
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const date = parseISO(selectedDate);
        let start = selectedDate;
        let end = selectedDate;

        if (viewMode === 'semana') {
          start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else if (viewMode === 'mes') {
          start = format(startOfMonth(date), 'yyyy-MM-dd');
          end = format(endOfMonth(date), 'yyyy-MM-dd');
        }

        await loadRentalsByDateRange(start, end);
      } catch (error) {
        console.error('Error loading metrics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, viewMode, loadRentalsByDateRange]);

  const filteredRentals = useMemo(() => {
    const date = parseISO(selectedDate);
    let start = selectedDate;
    let end = selectedDate;

    if (viewMode === 'semana') {
      start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (viewMode === 'mes') {
      start = format(startOfMonth(date), 'yyyy-MM-dd');
      end = format(endOfMonth(date), 'yyyy-MM-dd');
    }

    return rentals.filter((r) => {
      const rentalDate = r.datePaid || r.date;
      return rentalDate >= start && rentalDate <= end;
    });
  }, [rentals, selectedDate, viewMode]);

  const metrics = useMemo(() => {
    const totalRentals = filteredRentals.length;
    const totalUsd = filteredRentals.reduce((sum, r) => sum + r.totalUsd, 0);
    const totalBs = totalUsd * config.exchangeRate;

    const byShift = filteredRentals.reduce<Record<string, number>>((acc, r) => {
      acc[r.shift] = (acc[r.shift] ?? 0) + 1;
      return acc;
    }, {});

    // Detalle de máquinas usadas (mapeando IDs a nombres)
    const machineUsage = filteredRentals.reduce<
      Record<string, { name: string; count: number }>
    >((acc, r) => {
      const machine = washingMachines.find((m) => m.id === r.machineId);
      const name = machine?.name || 'Lavadora Desconocida';
      if (!acc[r.machineId]) {
        acc[r.machineId] = { name, count: 0 };
      }
      acc[r.machineId].count += 1;
      return acc;
    }, {});

    // Determinar día/mes más fuerte (solo para semana/mes)
    let busiestPeriod = '';
    if (viewMode !== 'dia' && filteredRentals.length > 0) {
      const periods = filteredRentals.reduce<Record<string, number>>((acc, r) => {
        const periodKey = viewMode === 'semana' ? r.date : r.date.substring(0, 7);
        acc[periodKey] = (acc[periodKey] ?? 0) + 1;
        return acc;
      }, {});
      
      const strongest = Object.entries(periods).sort((a, b) => b[1] - a[1])[0];
      if (strongest) {
        const periodDate = parseISO(viewMode === 'semana' ? strongest[0] : `${strongest[0]}-01`);
        busiestPeriod = format(periodDate, viewMode === 'semana' ? 'EEEE' : 'MMMM', { locale: es });
      }
    }

    return { totalRentals, totalUsd, totalBs, byShift, machineUsage, busiestPeriod };
  }, [filteredRentals, config.exchangeRate, washingMachines, viewMode]);

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        <header className="space-y-4">
          <h1 className="text-xl font-bold text-foreground">Métricas de Alquiler</h1>
          
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            loading={loading}
          />

          <Tabs 
            value={viewMode} 
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dia">Día</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            title="Alquileres"
            value={metrics.totalRentals.toString()}
            icon={<Hash className="w-5 h-5 text-blue-500" />}
            variant="info"
          />
          <KpiCard
            title="Total USD"
            value={`$${metrics.totalUsd.toFixed(2)}`}
            icon={<DollarSign className="w-5 h-5 text-success" />}
            variant="success"
          />
          <div className="col-span-2">
            <KpiCard
              title="Total Bolívares"
              value={`Bs ${metrics.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp className="w-5 h-5 text-warning" />}
              variant="warning"
            />
          </div>
          {metrics.busiestPeriod && (
            <div className="col-span-2">
              <KpiCard
                title={viewMode === 'semana' ? "Día más fuerte" : "Mes más fuerte"}
                value={metrics.busiestPeriod}
                icon={<Activity className="w-5 h-5 text-primary" />}
                variant="primary"
                className="capitalize"
              />
            </div>
          )}
        </div>

        {/* Detalle de Máquinas */}
        <section className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 border shadow-card-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl">
              <MachineIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground leading-tight">Lavadoras Utilizadas</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Uso detallado por equipo</p>
            </div>
          </div>
          
          <div className="grid gap-3">
            {Object.values(metrics.machineUsage).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 text-[11px] font-bold">
                  {item.count} {item.count === 1 ? 'alquiler' : 'alquileres'}
                </span>
              </div>
            ))}
            {Object.keys(metrics.machineUsage).length === 0 && (
              <div className="text-center py-10">
                <div className="p-3 bg-muted/20 rounded-full inline-block mb-3">
                  <MachineIcon className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  No hay registros de uso en este periodo
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Distribución por Turno */}
        <section className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 border shadow-card-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground leading-tight">Distribución por Turno</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Preferencias del cliente</p>
            </div>
          </div>
          <div className="space-y-1">
            {Object.entries(metrics.byShift).map(([shift, count]) => (
              <div
                key={shift}
                className="flex items-center justify-between py-3.5 px-2 border-b border-border/30 last:border-0 hover:bg-muted/10 rounded-lg transition-colors"
              >
                <span className="text-sm capitalize font-semibold text-muted-foreground">
                  {shift === 'medio' ? 'Medio Turno' : shift === 'completo' ? 'Turno Completo' : 'Turno Doble'}
                </span>
                <span className="text-sm font-black text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
