import { Calendar, CalendarDays } from 'lucide-react';

import { DateSelector } from '@/components/ventas/DateSelector';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          loading={loadingExpenses}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleViewMode}
        className={cn(
          'h-12 w-12 shrink-0 rounded-xl border transition-colors',
          viewMode === 'week'
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'text-muted-foreground'
        )}
        title={viewMode === 'day' ? 'Vista semanal' : 'Vista diaria'}
      >
        {viewMode === 'day' ? (
          <CalendarDays className="w-5 h-5" />
        ) : (
          <Calendar className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
