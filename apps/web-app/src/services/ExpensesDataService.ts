import { supabase } from '@/lib/supabaseClient';
import { Expense } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import { getDatesInRange } from '@/services/DateService';
import { DateKeyedLruCache } from '@/services/cache/DateKeyedLruCache';
import { expensePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import type { ExpenseReadRow } from '@/services/expenses/expenseSchemaContract';

const mapExpenseRow = (row: ExpenseReadRow): Expense => {
  const rawSplits = row.expense_payment_splits ?? row.payment_splits ?? [];

  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.payment_method || 'efectivo',
    paymentSplits:
      rawSplits.length > 0
        ? expensePaymentSplitAdapter.fromRows(rawSplits)
        : undefined,
    notes: row.notes,
    createdAt: normalizeTimestamp(
      row.created_at ?? row.createdAt,
      getSafeTimestamp()
    ),
  };
};

export interface IExpensesDataService {
  loadExpensesByDate(date: string): Promise<Expense[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedExpenses(date: string): Expense[] | null;
  hasCachedDate(date: string): boolean;
  loadExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Expense[]>>;
}

export class ExpensesDataService implements IExpensesDataService {
  private expensesCache: DateKeyedLruCache<Expense>;

  constructor(
    expensesCache: DateKeyedLruCache<Expense> = new DateKeyedLruCache<Expense>()
  ) {
    this.expensesCache = expensesCache;
  }

  async loadExpensesByDate(date: string): Promise<Expense[]> {
    const cached = this.expensesCache.get(date);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_payment_splits(*)')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading expenses for date ${date}:`, error);
      throw error;
    }

    const expenses = ((data || []) as ExpenseReadRow[]).map(mapExpenseRow);

    this.expensesCache.set(date, expenses);

    return expenses;
  }

  clearCache(): void {
    this.expensesCache.clear();
  }

  invalidateCache(date: string): void {
    this.expensesCache.delete(date);
  }

  getCachedExpenses(date: string): Expense[] | null {
    return this.expensesCache.get(date);
  }

  hasCachedDate(date: string): boolean {
    return this.expensesCache.has(date);
  }

  async loadExpensesByDates(dates: string[]): Promise<Map<string, Expense[]>> {
    const results = new Map<string, Expense[]>();
    const datesToLoad = dates.filter((date) => !this.expensesCache.has(date));

    if (datesToLoad.length === 0) {
      for (const date of dates) {
        const cached = this.expensesCache.get(date);
        if (cached) {
          results.set(date, cached);
        }
      }
      return results;
    }

    const promises = datesToLoad.map(async (date) => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_payment_splits(*)')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading expenses for date ${date}:`, error);
        return { date, expenses: [] };
      }

      const expenses = ((data || []) as ExpenseReadRow[]).map(mapExpenseRow);

      this.expensesCache.set(date, expenses);

      return { date, expenses };
    });

    await Promise.all(promises);

    for (const date of dates) {
      const cached = this.expensesCache.get(date);
      if (cached) {
        results.set(date, cached);
      }
    }

    return results;
  }

  async loadExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Expense[]>> {
    const results = new Map<string, Expense[]>();
    const datesInRange = getDatesInRange(startDate, endDate);

    const allCached = datesInRange.every((d) => this.expensesCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.expensesCache.get(date) || []);
      }
      return results;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_payment_splits(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        `Error loading expenses for range ${startDate} to ${endDate}:`,
        error
      );
      throw error;
    }

    const grouped: Record<string, Expense[]> = {};
    for (const date of datesInRange) {
      grouped[date] = [];
    }

    ((data || []) as ExpenseReadRow[]).forEach((e) => {
      const dateKey = e.date.substring(0, 10);

      if (grouped[dateKey]) {
        grouped[dateKey].push(mapExpenseRow(e));
      }
    });

    for (const date of datesInRange) {
      const expenses = grouped[date] || [];
      this.expensesCache.set(date, expenses);
      results.set(date, expenses);
    }

    return results;
  }
}

export const expensesDataService = new ExpensesDataService();
