import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';

export interface DayFinancialLoaders {
  loadSalesByDateRange?: (start: string, end: string) => Promise<void>;
  loadRentalsByDateRange?: (start: string, end: string) => Promise<void>;
  loadExpensesByDate?: (date: string) => Promise<unknown>;
  loadPaidTipsByDateRange?: (start: string, end: string) => Promise<void>;
}

export function useDayFinancialData(
  date: string,
  loaders: DayFinancialLoaders
): void {
  const { coreLoadedAt } = useAppStore();
  const {
    loadSalesByDateRange,
    loadRentalsByDateRange,
    loadExpensesByDate,
    loadPaidTipsByDateRange,
  } = loaders;

  useEffect(() => {
    void Promise.all([
      loadSalesByDateRange?.(date, date),
      loadRentalsByDateRange?.(date, date),
      loadExpensesByDate?.(date),
      loadPaidTipsByDateRange?.(date, date),
    ]).catch((error) => {
      console.error('Error loading the financial data of the date', error);
    });
  }, [
    date,
    coreLoadedAt,
    loadSalesByDateRange,
    loadRentalsByDateRange,
    loadExpensesByDate,
    loadPaidTipsByDateRange,
  ]);
}
