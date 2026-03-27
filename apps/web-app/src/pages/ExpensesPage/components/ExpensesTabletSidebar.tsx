import { Calendar, CalendarDays, Plus, Wallet } from 'lucide-react';

import { TabletControlsCard } from '@/components/layout/TabletControlsCard';
import { DateSelector } from '@/components/ventas/DateSelector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ExpensesViewMode = 'day' | 'week';

interface ExpensesTabletSidebarProps {
  selectedDate: string;
  loadingExpenses: boolean;
  viewMode: ExpensesViewMode;
  totalExpenses: number;
  onDateChange: (date: string) => void;
  onToggleViewMode: () => void;
  onOpenNewExpense: () => void;
  className?: string;
  dataTestId?: string;
}

export function ExpensesTabletSidebar({
  selectedDate,
  loadingExpenses,
  viewMode,
  totalExpenses,
  onDateChange,
  onToggleViewMode,
  onOpenNewExpense,
  className,
  dataTestId = 'expenses-secondary-column',
}: ExpensesTabletSidebarProps) {
  return (
    <TabletControlsCard
      className={className}
      data-testid={dataTestId}
      title="Controles"
    >
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

      {viewMode === 'day' ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-foreground">
                Total Egresos
              </span>
            </div>
            <span className="text-xl font-extrabold text-destructive">
              Bs {totalExpenses.toFixed(2)}
            </span>
          </div>
        </div>
      ) : null}

      <Button
        onClick={onOpenNewExpense}
        className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground"
      >
        <Plus className="w-5 h-5 mr-2" />
        Registrar Egreso
      </Button>
    </TabletControlsCard>
  );
}
