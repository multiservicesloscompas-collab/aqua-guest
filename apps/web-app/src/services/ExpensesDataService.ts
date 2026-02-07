/**
 * Servicio de carga de egresos - SRP: Single Responsibility Principle
 * Responsabilidad única: cargar egresos de forma optimizada con caching
 */

import { supabase } from '@/lib/supabaseClient';
import { Expense } from '@/types';
import {
  getSafeTimestamp,
  normalizeTimestamp,
} from '@/lib/date-utils';

export interface IExpensesDataService {
  loadExpensesByDate(date: string): Promise<Expense[]>;
  clearCache(): void;
  getCachedExpenses(date: string): Expense[] | null;
  hasCachedDate(date: string): boolean;
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
      createdAt: normalizeTimestamp(e.created_at ?? e.createdAt, getSafeTimestamp()),
    }));

    this.expensesCache.set(date, expenses);

    return expenses;
  }

  clearCache(): void {
    this.expensesCache.clear();
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
        createdAt: normalizeTimestamp(e.created_at ?? e.createdAt, getSafeTimestamp()),
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
}

export const expensesDataService = new ExpensesDataService();
