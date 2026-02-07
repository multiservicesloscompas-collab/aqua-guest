import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  loading?: boolean;
}

export function DateSelector({ selectedDate, onDateChange, loading = false }: DateSelectorProps) {
  const date = new Date(selectedDate + 'T12:00:00');
  const isCurrentDay = isToday(date);

  const handlePrevDay = () => {
    const prev = subDays(date, 1);
    onDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(date, 1);
    onDateChange(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  const displayDate = format(date, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="flex items-center justify-between bg-card rounded-xl p-3 border shadow-card">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevDay}
        disabled={loading}
        className="touch-target rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <button
        onClick={handleToday}
        disabled={loading}
        className="flex flex-col items-center gap-0.5 flex-1 px-2 disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground capitalize">
            {displayDate}
          </span>
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>
        {!isCurrentDay && !loading && (
          <span className="text-xs text-primary font-medium">Ir a hoy</span>
        )}
        {isCurrentDay && !loading && (
          <span className="text-xs text-success font-medium">Hoy</span>
        )}
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        disabled={loading}
        className="touch-target rounded-full"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}

