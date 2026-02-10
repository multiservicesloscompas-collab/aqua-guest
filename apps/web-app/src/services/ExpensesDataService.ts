/**
 * Servicio de carga de egresos - SRP: Single Responsibility Principle
 * Responsabilidad única: cargar egresos de forma optimizada con caching
 */

import { supabase } from '@/lib/supabaseClient';
import { Expense } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';

export interface IExpensesDataService {
  loadExpensesByDate(date: string): Promise<Expense[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedExpenses(date: string): Expense[] | null;
  hasCachedDate(date: string): boolean;
  loadExpensesByDateRange(startDate: string, endDate: string): Promise<Map<string, Expense[]>>;
}

/**
 * Servicio de caché de egresos por fecha
 * Implementa LSP: Liskov Substitution Principle
 */
class ExpensesCache {
  private cache: Map<string, Expense[]> = new Map();
  private maxSize = 30;

  set(date: string, expenses: Expense[]): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(date)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(date, expenses);
  }

  get(date: string): Expense[] | null {
    return this.cache.get(date) || null;
  }

  has(date: string): boolean {
    return this.cache.has(date);
  }

  clear(): void {
    this.cache.clear();
  }

  delete(date: string): boolean {
    return this.cache.delete(date);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}

/**
 * Servicio de datos de egresos
 * Implementa OCP: Open/Closed Principle
 */
export class ExpensesDataService implements IExpensesDataService {
  private expensesCache: ExpensesCache;

  constructor(expensesCache: ExpensesCache = new ExpensesCache()) {
    this.expensesCache = expensesCache;
  }

  async loadExpensesByDate(date: string): Promise<Expense[]> {
    const cached = this.expensesCache.get(date);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading expenses for date ${date}:`, error);
      throw error;
    }

    const expenses: Expense[] = (data || []).map((e: any) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: Number(e.amount),
      category: e.category,
      paymentMethod: e.payment_method || 'efectivo',
      notes: e.notes,
      createdAt: normalizeTimestamp(
        e.created_at ?? e.createdAt,
        getSafeTimestamp()
      ),
    }));

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
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading expenses for date ${date}:`, error);
        return { date, expenses: [] };
      }

      const expenses: Expense[] = (data || []).map((e: any) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        paymentMethod: e.payment_method || 'efectivo',
        notes: e.notes,
        createdAt: normalizeTimestamp(
          e.created_at ?? e.createdAt,
          getSafeTimestamp()
        ),
      }));

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

  /**
   * Carga egresos en un rango de fechas de forma eficiente (1 query)
   */
  async loadExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Expense[]>> {
    const results = new Map<string, Expense[]>();
    const datesInRange: string[] = [];

    const current = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesInRange.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    const allCached = datesInRange.every((d) => this.expensesCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.expensesCache.get(date) || []);
      }
      return results;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
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

    (data || []).forEach((e: any) => {
      const dateKey = e.date.substring(0, 10);

      if (grouped[dateKey]) {
        grouped[dateKey].push({
          id: e.id,
          date: dateKey,
          description: e.description,
          amount: Number(e.amount),
          category: e.category,
          paymentMethod: e.payment_method || 'efectivo',
          notes: e.notes,
          createdAt: normalizeTimestamp(
            e.created_at ?? e.createdAt,
            getSafeTimestamp()
          ),
        });
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
