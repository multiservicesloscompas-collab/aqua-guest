import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TimeFilter = 'dia' | 'semana' | 'mes';

interface DeliveryFiltersCardProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
}

export function DeliveryFiltersCard({
  timeFilter,
  onTimeFilterChange,
}: DeliveryFiltersCardProps) {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden rounded-[24px]">
      <CardHeader className="pb-3 bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-foreground/80">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <Truck className="h-4 w-4" />
          </div>
          Filtrar por período
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-5 px-5 bg-muted/5 space-y-4">
        <div className="flex bg-muted/40 p-1.5 rounded-2xl">
          <button
            onClick={() => onTimeFilterChange('dia')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              timeFilter === 'dia'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => onTimeFilterChange('semana')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              timeFilter === 'semana'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => onTimeFilterChange('mes')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              timeFilter === 'mes'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            Mes
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
