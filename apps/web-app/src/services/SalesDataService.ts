import { supabase } from '@/lib/supabaseClient';
import { CartItem, PaymentMethod, Sale } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import {
  PAYMENT_SPLIT_SCHEMA,
  type PaymentSplitRow,
} from '@/services/payments/paymentSplitSchemaContract';
import { salePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';

interface SalesRow {
  id: string;
  daily_number?: number | null;
  dailyNumber?: number | null;
  date: string;
  items?: CartItem[] | null;
  payment_method?: PaymentMethod | null;
  paymentMethod?: PaymentMethod | null;
  total_bs?: number | null;
  totalBs?: number | null;
  total_usd?: number | null;
  totalUsd?: number | null;
  exchange_rate?: number | null;
  exchangeRate?: number | null;
  notes?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  sale_payment_splits?: PaymentSplitRow[] | null;
}

const toSale = (row: SalesRow, dateOverride?: string): Sale => {
  const splits = salePaymentSplitAdapter.fromRows(
    row.sale_payment_splits ?? []
  );

  return {
    id: row.id,
    dailyNumber: row.daily_number ?? row.dailyNumber ?? 0,
    date: dateOverride ?? row.date,
    items: row.items ?? [],
    paymentMethod: row.payment_method ?? row.paymentMethod ?? 'efectivo',
    paymentSplits: splits.length ? splits : undefined,
    totalBs: Number(row.total_bs ?? row.totalBs ?? 0),
    totalUsd: Number(row.total_usd ?? row.totalUsd ?? 0),
    exchangeRate: Number(row.exchange_rate ?? row.exchangeRate ?? 0),
    notes: row.notes ?? undefined,
    createdAt: normalizeTimestamp(
      row.created_at ?? row.createdAt ?? undefined,
      getSafeTimestamp()
    ),
    updatedAt: normalizeTimestamp(
      row.updated_at ?? row.updatedAt ?? undefined,
      getSafeTimestamp()
    ),
  };
};

const SALES_SELECT = `*, ${PAYMENT_SPLIT_SCHEMA.salesSplitsTable}(payment_method, amount_bs, amount_usd, exchange_rate_used)`;

export interface ISalesDataService {
  loadSalesByDate(date: string): Promise<Sale[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedSales(date: string): Sale[] | null;
  hasCachedDate(date: string): boolean;
  loadSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Sale[]>>;
}

class SalesCache {
  private cache: Map<string, Sale[]> = new Map();
  private maxSize = 30; // Caché hasta 30 días

  set(date: string, sales: Sale[]): void {
    // Implementar política de tamaño máximo (LRU simple)
    if (this.cache.size >= this.maxSize && !this.cache.has(date)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(date, sales);
  }

  get(date: string): Sale[] | null {
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

export class SalesDataService implements ISalesDataService {
  private salesCache: SalesCache;

  constructor(salesCache: SalesCache = new SalesCache()) {
    this.salesCache = salesCache;
  }

  async loadSalesByDate(date: string): Promise<Sale[]> {
    const cached = this.salesCache.get(date);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('sales')
      .select(SALES_SELECT)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading sales for date ${date}:`, error);
      throw error;
    }

    const sales: Sale[] = (data ?? []).map((row) =>
      toSale(row as unknown as SalesRow)
    );

    // 4. Guardar en caché
    this.salesCache.set(date, sales);

    return sales;
  }

  clearCache(): void {
    this.salesCache.clear();
  }

  invalidateCache(date: string): void {
    this.salesCache.delete(date);
  }

  getCachedSales(date: string): Sale[] | null {
    return this.salesCache.get(date);
  }

  hasCachedDate(date: string): boolean {
    return this.salesCache.has(date);
  }

  async loadSalesByDates(dates: string[]): Promise<Map<string, Sale[]>> {
    const results = new Map<string, Sale[]>();

    const datesToLoad = dates.filter((date) => !this.salesCache.has(date));

    if (datesToLoad.length === 0) {
      for (const date of dates) {
        const cached = this.salesCache.get(date);
        if (cached) {
          results.set(date, cached);
        }
      }
      return results;
    }

    const promises = datesToLoad.map(async (date) => {
      const { data, error } = await supabase
        .from('sales')
        .select(SALES_SELECT)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading sales for date ${date}:`, error);
        return { date, sales: [] };
      }

      const sales: Sale[] = (data ?? []).map((row) =>
        toSale(row as unknown as SalesRow)
      );

      this.salesCache.set(date, sales);

      return { date, sales };
    });

    await Promise.all(promises);

    for (const date of dates) {
      const cached = this.salesCache.get(date);
      if (cached) {
        results.set(date, cached);
      }
    }

    return results;
  }

  async loadSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Sale[]>> {
    const results = new Map<string, Sale[]>();
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

    const allCached = datesInRange.every((d) => this.salesCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.salesCache.get(date) || []);
      }
      return results;
    }

    const { data, error } = await supabase
      .from('sales')
      .select(SALES_SELECT)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        `Error loading sales for range ${startDate} to ${endDate}:`,
        error
      );
      throw error;
    }

    const grouped: Record<string, Sale[]> = {};
    for (const date of datesInRange) {
      grouped[date] = [];
    }

    (data ?? []).forEach((row) => {
      const saleRow = row as unknown as SalesRow;
      const dateKey = saleRow.date.substring(0, 10);

      if (grouped[dateKey]) {
        grouped[dateKey].push(toSale(saleRow, dateKey));
      }
    });

    for (const date of datesInRange) {
      const sales = grouped[date] || [];
      this.salesCache.set(date, sales);
      results.set(date, sales);
    }

    return results;
  }
}
export const salesDataService = new SalesDataService();
