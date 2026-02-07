import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Wallet, Loader2, CalendarDays, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useWeeklyExpenses, WeekGroup, MonthTotal } from '@/hooks/useWeeklyExpenses';
import { ExpenseCard } from '@/components/egresos/ExpenseCard';
import { Expense } from '@/types';

interface WeeklyExpensesViewProps {
  anchorDate: string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingId: string | null;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  monthTotal: number;
  weeks: WeekGroup[];
}

function MonthSummaryCard({ monthGroup }: { monthGroup: MonthGroup }) {
  return (
    <div className="bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/30 rounded-xl p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-destructive/20 rounded-xl">
            <TrendingDown className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-xs font-medium text-destructive/80 uppercase tracking-wide">
              {monthGroup.monthLabel}
            </p>
            <p className="text-sm font-semibold text-foreground">
              Total de Egresos
            </p>
          </div>
        </div>
        <span className="text-2xl font-black text-destructive">
          Bs {monthGroup.monthTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function WeekHeader({ week }: { week: WeekGroup }) {
  const start = new Date(week.weekStart + 'T12:00:00');
  const end = new Date(week.weekEnd + 'T12:00:00');
  const label = `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM", { locale: es })}`;

  return (
    <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground capitalize">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-destructive">
        Bs {week.weekTotal.toFixed(2)}
      </span>
    </div>
  );
}

function DayHeader({ label, total }: { label: string; total: number }) {
  return (
    <div className="flex items-center justify-between px-1 pt-3 pb-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide capitalize">
        {label}
      </span>
      {total > 0 && (
        <span className="text-xs font-semibold text-destructive">
          Bs {total.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export function WeeklyExpensesView({
  anchorDate,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: WeeklyExpensesViewProps) {
  const { weeks, isLoading, isLoadingMore, hasMore, loadMore, monthTotals } =
    useWeeklyExpenses(anchorDate);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Setup intersection observer for infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    },
    [hasMore, isLoadingMore, loadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersection]);

  // Group weeks by month
  const monthGroups: MonthGroup[] = useMemo(() => {
    const monthMap = new Map<string, WeekGroup[]>();
    
    weeks.forEach((week) => {
      const existing = monthMap.get(week.monthKey) || [];
      existing.push(week);
      monthMap.set(week.monthKey, existing);
    });

    return Array.from(monthMap.entries()).map(([monthKey, monthWeeks]) => {
      const monthTotal = monthTotals.find((m) => m.monthKey === monthKey);
      return {
        monthKey,
        monthLabel: monthTotal?.monthLabel || monthKey,
        monthTotal: monthTotal?.total || 0,
        weeks: monthWeeks,
      };
    });
  }, [weeks, monthTotals]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 mb-3 animate-spin" />
        <p className="text-sm font-medium">Cargando egresos de la semana...</p>
      </div>
    );
  }

  const hasAnyExpenses = weeks.some((w: WeekGroup) =>
    w.days.some((d) => d.expenses.length > 0)
  );

  if (!hasAnyExpenses && weeks.length > 0) {
    return (
      <div className="space-y-3">
        <WeekHeader week={weeks[0]} />
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Wallet className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Sin egresos esta semana</p>
          <p className="text-xs">Presiona + para registrar un gasto</p>
        </div>
        <div ref={sentinelRef} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {monthGroups.map((monthGroup) => (
        <div key={monthGroup.monthKey} className="space-y-2">
          {/* Card del mes */}
          <MonthSummaryCard monthGroup={monthGroup} />
          
          {/* Semanas del mes */}
          {monthGroup.weeks.map((week: WeekGroup) => (
            <div key={week.weekStart} className="space-y-1">
              <WeekHeader week={week} />
              {week.days.map((day) => {
                if (day.expenses.length === 0) return null;
                return (
                  <div key={day.date}>
                    <DayHeader label={day.label} total={day.total} />
                    <div className="space-y-2">
                      {day.expenses.map((expense: Expense) => (
                        <ExpenseCard
                          key={expense.id}
                          expense={expense}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          isDeleting={isDeleting}
                          deletingId={deletingId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <div ref={sentinelRef} className="py-2">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando más semanas...</span>
          </div>
        )}
      </div>
    </div>
  );
}
