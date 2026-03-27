import { Calendar, CalendarDays } from 'lucide-react';

import { DateSelector } from '@/components/ventas/DateSelector';
import { cn } from '@/lib/utils';

type ExpensesViewMode = 'day' | 'week';

interface ExpensesMobileHeaderControlsProps {
  selectedDate: string;
  loadingExpenses: boolean;
  viewMode: ExpensesViewMode;
  onDateChange: (date: string) => void;
  onToggleViewMode: () => void;
}

export function ExpensesMobileHeaderControls({
  selectedDate,
  loadingExpenses,
  viewMode,
  onDateChange,
  onToggleViewMode,
}: ExpensesMobileHeaderControlsProps) {
  const isDayView = viewMode === 'day';
  const title = isDayView ? 'Ver historial completo' : 'Volver a vista diaria';
  const subtitle = isDayView
    ? 'Todos los egresos en el tiempo'
    : 'Mostrar solo hoy';
  const sideLabel = isDayView ? 'Ver todo' : 'Hoy';

  return (
    <div className="space-y-3">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        loading={loadingExpenses}
      />

      <button
        onClick={onToggleViewMode}
        title={isDayView ? 'Cambiar a vista semanal' : 'Volver a vista diaria'}
        className={cn(
          'w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-300',
          'bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.98]'
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-2xl shrink-0',
              isDayView 
                ? 'bg-blue-500/10 text-blue-600' 
                : 'bg-emerald-500/10 text-emerald-600'
            )}
          >
            {isDayView ? <CalendarDays className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          </div>
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            <span className="text-[15px] font-bold text-foreground truncate select-none">
              {title}
            </span>
            <span className="text-[13px] font-medium text-muted-foreground truncate select-none">
              {subtitle}
            </span>
          </div>
        </div>
        
        <div
          className={cn(
            'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap select-none',
            isDayView
              ? 'bg-blue-500/10 text-blue-600'
              : 'bg-emerald-500/10 text-emerald-600'
          )}
        >
          {sideLabel}
        </div>
      </button>
    </div>
  );
}
