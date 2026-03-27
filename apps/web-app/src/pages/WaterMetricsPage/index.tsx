import { Calendar } from 'lucide-react';
import { DateSelector } from '@/components/ventas/DateSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppRoute } from '@/types';

import {
  useWaterMetricsViewModel,
  DateRange,
} from './hooks/useWaterMetricsViewModel';
import { WaterMetricsKpiCards } from './components/WaterMetricsKpiCards';
import { WaterMetricsBreakdownList } from './components/WaterMetricsBreakdownList';

interface WaterMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function WaterMetricsPage({ onNavigate }: WaterMetricsPageProps = {}) {
  const { selectedDate, setSelectedDate, range, setRange, dateRange, metrics } =
    useWaterMetricsViewModel();

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de rango */}
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="h-12 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Día</SelectItem>
              <SelectItem value="week">Por Semana</SelectItem>
              <SelectItem value="month">Por Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selector de fecha */}
        {range === 'day' && (
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {range !== 'day' && (
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {dateRange.startDate.toLocaleDateString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                -{' '}
                {dateRange.endDate.toLocaleDateString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        <WaterMetricsKpiCards metrics={metrics} />

        <WaterMetricsBreakdownList
          breakdown={metrics.breakdown}
          salesCount={metrics.salesCount}
          totalLiters={metrics.totalLiters}
        />
      </main>
    </div>
  );
}
