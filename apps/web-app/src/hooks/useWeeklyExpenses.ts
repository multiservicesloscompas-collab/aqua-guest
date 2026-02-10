import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
  addDays,
  isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { Expense } from '@/types';
import { getVenezuelaDate } from '@/services/DateService';

export interface DayGroup {
  date: string;
  label: string;
  expenses: Expense[];
  total: number;
}

export interface WeekGroup {
  weekStart: string;
  weekEnd: string;
  days: DayGroup[];
  weekTotal: number;
  monthKey: string;
}

export interface MonthTotal {
  monthKey: string;
  monthLabel: string;
  total: number;
}

interface UseWeeklyExpensesReturn {
  weeks: WeekGroup[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  monthTotals: MonthTotal[];
}

function getDatesBetween(start: Date, end: Date): string[] {
  const dates: string[] = [];
  let current = start;
  while (!isBefore(end, current)) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }
  return dates;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date(getVenezuelaDate() + 'T12:00:00');
  const todayStr = format(today, 'yyyy-MM-dd');
  if (dateStr === todayStr) return 'Hoy';

  const yesterday = addDays(today, -1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
  if (dateStr === yesterdayStr) return 'Ayer';

  return format(date, 'EEEE, d MMM', { locale: es });
}

const MAX_WEEKS = 12;

export function useWeeklyExpenses(anchorDate: string): UseWeeklyExpensesReturn {
  const { getExpensesByDate, loadExpensesByDates } = useAppStore();
  const [loadedWeekStarts, setLoadedWeekStarts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const anchorWeekStart = useMemo(() => {
    const anchor = new Date(anchorDate + 'T12:00:00');
    return format(startOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }, [anchorDate]);

  useEffect(() => {
    setLoadedWeekStarts([]);
  }, [anchorWeekStart]);

  useEffect(() => {
    if (loadedWeekStarts.length > 0) return;
    if (loadingRef.current) return;

    const loadInitialWeek = async () => {
      loadingRef.current = true;
      setIsLoading(true);
      try {
        const weekStartDate = new Date(anchorWeekStart + 'T12:00:00');
        const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
        const dates = getDatesBetween(weekStartDate, weekEndDate);
        await loadExpensesByDates(dates);
        setLoadedWeekStarts([anchorWeekStart]);
      } catch (err) {
        console.error('Error loading initial week expenses:', err);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadInitialWeek();
  }, [anchorWeekStart, loadedWeekStarts.length, loadExpensesByDates]);

  const hasMore = loadedWeekStarts.length < MAX_WEEKS;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loadedWeekStarts.length === 0) return;

    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const oldestLoaded = loadedWeekStarts[loadedWeekStarts.length - 1];
      const oldestDate = new Date(oldestLoaded + 'T12:00:00');
      const prevWeekStart = subWeeks(oldestDate, 1);
      const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 });
      const prevWeekStartStr = format(prevWeekStart, 'yyyy-MM-dd');
      const dates = getDatesBetween(prevWeekStart, prevWeekEnd);
      await loadExpensesByDates(dates);
      setLoadedWeekStarts((prev) => [...prev, prevWeekStartStr]);
    } catch (err) {
      console.error('Error loading more week expenses:', err);
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [hasMore, loadedWeekStarts, loadExpensesByDates]);

  const weeks = useMemo<WeekGroup[]>(() => {
    return loadedWeekStarts.map((weekStartStr) => {
      const weekStartDate = new Date(weekStartStr + 'T12:00:00');
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      const weekEndStr = format(weekEndDate, 'yyyy-MM-dd');
      const dates = getDatesBetween(weekStartDate, weekEndDate);

      const days: DayGroup[] = dates
        .slice()
        .reverse()
        .map((date) => {
          const expenses = getExpensesByDate(date);
          return {
            date,
            label: formatDayLabel(date),
            expenses,
            total: expenses.reduce(
              (sum: number, e: Expense) => sum + e.amount,
              0
            ),
          };
        });

      const weekTotal = days.reduce(
        (sum: number, d: DayGroup) => sum + d.total,
        0
      );
      const monthKey = format(weekStartDate, 'yyyy-MM');

      return {
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        days,
        weekTotal,
        monthKey,
      };
    });
  }, [loadedWeekStarts, getExpensesByDate]);

  const monthTotals = useMemo<MonthTotal[]>(() => {
    const monthMap = new Map<string, number>();

    weeks.forEach((week) => {
      const current = monthMap.get(week.monthKey) || 0;
      monthMap.set(week.monthKey, current + week.weekTotal);
    });

    return Array.from(monthMap.entries())
      .map(([monthKey, total]) => {
        const [year, month] = monthKey.split('-');
        const monthNames = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ];
        const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
        return { monthKey, monthLabel, total };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [weeks]);

  return { weeks, isLoading, isLoadingMore, hasMore, loadMore, monthTotals };
}
