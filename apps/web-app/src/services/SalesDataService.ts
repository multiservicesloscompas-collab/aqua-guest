/**
 * Servicio de carga de ventas - SRP: Single Responsibility Principle
 * Responsabilidad única: cargar ventas de forma optimizada con caching
 */

import { supabase } from '@/lib/supabaseClient';
import { Sale } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';

export interface ISalesDataService {
  loadSalesByDate(date: string): Promise<Sale[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedSales(date: string): Sale[] | null;
  hasCachedDate(date: string): boolean;
  loadSalesByDateRange(startDate: string, endDate: string): Promise<Map<string, Sale[]>>;
}

/**
 * Servicio de caché de ventas por fecha
 * Implementa LSP: Liskov Substitution Principle
 * Se puede substituir con otra implementación de caché
 */
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

/**
 * Servicio de datos de ventas
 * Implementa OCP: Open/Closed Principle
 * Abierto para extensión (nuevas estrategias de carga)
 * Cerrado para modificación
 */
export class SalesDataService implements ISalesDataService {
  private salesCache: SalesCache;

  constructor(salesCache: SalesCache = new SalesCache()) {
    this.salesCache = salesCache;
  }

  async loadSalesByDate(date: string): Promise<Sale[]> {
    // 1. Verificar si ya está en caché
    const cached = this.salesCache.get(date);
    if (cached) {
      return cached;
    }

    // 2. Fetch desde Supabase solo de la fecha específica
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading sales for date ${date}:`, error);
      throw error;
    }

    // 3. Transformar datos
    const sales: Sale[] = (data || []).map((s: any) => ({
      id: s.id,
      dailyNumber: s.daily_number ?? s.dailyNumber,
      date: s.date,
      items: s.items || [],
      paymentMethod: s.payment_method || s.paymentMethod,
      totalBs: Number(s.total_bs ?? s.totalBs ?? 0),
      totalUsd: Number(s.total_usd ?? s.totalUsd ?? 0),
      exchangeRate: Number(s.exchange_rate ?? s.exchangeRate ?? 0),
      notes: s.notes,
      createdAt: normalizeTimestamp(
        s.created_at ?? s.createdAt,
        getSafeTimestamp()
      ),
      updatedAt: normalizeTimestamp(
        s.updated_at ?? s.updatedAt,
        getSafeTimestamp()
      ),
    }));

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

  /**
   * Carga ventas de múltiples fechas en paralelo (para Dashboard)
   */
  async loadSalesByDates(dates: string[]): Promise<Map<string, Sale[]>> {
    const results = new Map<string, Sale[]>();

    // Cargar fechas que no están en caché
    const datesToLoad = dates.filter((date) => !this.salesCache.has(date));

    if (datesToLoad.length === 0) {
      // Todas las fechas están en caché
      for (const date of dates) {
        const cached = this.salesCache.get(date);
        if (cached) {
          results.set(date, cached);
        }
      }
      return results;
    }

    // Cargar fechas faltantes en paralelo
    const promises = datesToLoad.map(async (date) => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading sales for date ${date}:`, error);
        return { date, sales: [] };
      }

      const sales: Sale[] = (data || []).map((s: any) => ({
        id: s.id,
        dailyNumber: s.daily_number ?? s.dailyNumber,
        date: s.date,
        items: s.items || [],
        paymentMethod: s.payment_method || s.paymentMethod,
        totalBs: Number(s.total_bs ?? s.totalBs ?? 0),
        totalUsd: Number(s.total_usd ?? s.totalUsd ?? 0),
        exchangeRate: Number(s.exchange_rate ?? s.exchangeRate ?? 0),
        notes: s.notes,
        createdAt: normalizeTimestamp(
          s.created_at ?? s.createdAt,
          getSafeTimestamp()
        ),
        updatedAt: normalizeTimestamp(
          s.updated_at ?? s.updatedAt,
          getSafeTimestamp()
        ),
      }));

      this.salesCache.set(date, sales);

      return { date, sales };
    });

    await Promise.all(promises);

    // Combinar resultados cargados con los que ya estaban en caché
    for (const date of dates) {
      const cached = this.salesCache.get(date);
      if (cached) {
        results.set(date, cached);
      }
    }

    return results;
  }

  /**
   * Carga ventas en un rango de fechas de forma eficiente (1 query)
   */
  async loadSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Sale[]>> {
    const results = new Map<string, Sale[]>();
    const datesInRange: string[] = [];

    // Generar todas las fechas en el rango
    const current = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesInRange.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    // Verificar cuáles fechas ya están en caché para no recargarlas innecesariamente
    const allCached = datesInRange.every((d) => this.salesCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.salesCache.get(date) || []);
      }
      return results;
    }

    // Fetch range query
    const { data, error } = await supabase
      .from('sales')
      .select('*')
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

    // Agrupar resultados por fecha
    const grouped: Record<string, Sale[]> = {};
    for (const date of datesInRange) {
      grouped[date] = [];
    }

    (data || []).forEach((s: any) => {
      // Normalizar fecha del registro para asegurar coincidencia
      const dateKey = s.date.substring(0, 10);

      if (grouped[dateKey]) {
        grouped[dateKey].push({
          id: s.id,
          dailyNumber: s.daily_number ?? s.dailyNumber,
          date: dateKey,
          items: s.items || [],
          paymentMethod: s.payment_method || s.paymentMethod,
          totalBs: Number(s.total_bs ?? s.totalBs ?? 0),
          totalUsd: Number(s.total_usd ?? s.totalUsd ?? 0),
          exchangeRate: Number(s.exchange_rate ?? s.exchangeRate ?? 0),
          notes: s.notes,
          createdAt: normalizeTimestamp(
            s.created_at ?? s.createdAt,
            getSafeTimestamp()
          ),
          updatedAt: normalizeTimestamp(
            s.updated_at ?? s.updatedAt,
            getSafeTimestamp()
          ),
        });
      }
    });

    // Actualizar caché y resultados
    for (const date of datesInRange) {
      const sales = grouped[date] || [];
      this.salesCache.set(date, sales);
      results.set(date, sales);
    }

    return results;
  }
}

// Singleton para inyección de dependencias - DIP: Dependency Inversion Principle
export const salesDataService = new SalesDataService();
