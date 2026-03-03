import { useCallback, useEffect, useRef, useState } from 'react';

interface DashboardDataLoaders {
  loadSalesByDateRange: (start: string, end: string) => Promise<void>;
  loadExpensesByDateRange: (start: string, end: string) => Promise<void>;
  loadRentalsByDateRange: (start: string, end: string) => Promise<void>;
}

interface DashboardDataResult {
  loading: boolean;
  reloadMonth: () => void;
}

function getMonthRange(date: string) {
  const start = date.slice(0, 7) + '-01';
  const dateObj = new Date(date + 'T12:00:00');
  const lastDay = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth() + 1,
    0
  ).getDate();
  const end = date.slice(0, 7) + '-' + String(lastDay).padStart(2, '0');

  return { start, end, key: `${start}_${end}` };
}

export function useDashboardData(
  selectedDate: string,
  loaders: DashboardDataLoaders
): DashboardDataResult {
  const [loading, setLoading] = useState(false);
  const lastLoadedRange = useRef<string>('');

  const loadMonthData = useCallback(
    async (date: string, force = false) => {
      const range = getMonthRange(date);
      if (!force && lastLoadedRange.current === range.key) return;
      lastLoadedRange.current = range.key;

      setLoading(true);
      try {
        await Promise.all([
          loaders.loadSalesByDateRange(range.start, range.end),
          loaders.loadExpensesByDateRange(range.start, range.end),
          loaders.loadRentalsByDateRange(range.start, range.end),
        ]);
      } catch (err) {
        console.error('Error loading month data for dashboard', err);
      } finally {
        setLoading(false);
      }
    },
    [loaders]
  );

  useEffect(() => {
    loadMonthData(selectedDate, false);
  }, [selectedDate, loadMonthData]);

  const reloadMonth = useCallback(() => {
    loadMonthData(selectedDate, true);
  }, [loadMonthData, selectedDate]);

  return { loading, reloadMonth };
}
