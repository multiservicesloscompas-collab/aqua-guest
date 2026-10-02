import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export interface DayFinancialLoaders {
  loadSalesByDateRange?: (start: string, end: string) => Promise<void>;
  loadRentalsByDateRange?: (start: string, end: string) => Promise<void>;
  loadExpensesByDate?: (date: string) => Promise<unknown>;
  loadPaidTipsByDateRange?: (start: string, end: string) => Promise<void>;
}

/**
 * Loads what a per-date screen (Transactions, payment-method detail, Equilibrio)
 * needs for the selected date, so it does not depend on whatever month another
 * screen happened to load (FIN-06). Loaders are injected by the screen. It runs
 * again when the date changes and after every global sync, which replaces the
 * sales, tips and expenses stores (see `useAppStore.coreLoadedAt`, FIN-12).
 */
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
