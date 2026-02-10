/**
 * Servicio de carga de alquileres - SRP: Single Responsibility Principle
 * Responsabilidad única: cargar alquileres de forma optimizada con caching
 */

import { supabase } from '@/lib/supabaseClient';
import { WasherRental } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';

export interface IRentalsDataService {
  loadRentalsByDate(date: string): Promise<WasherRental[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedRentals(date: string): WasherRental[] | null;
  hasCachedDate(date: string): boolean;
  loadRentalsByDateRange(startDate: string, endDate: string): Promise<Map<string, WasherRental[]>>;
}

/**
 * Servicio de caché de alquileres por fecha
 * Implementa LSP: Liskov Substitution Principle
 */
class RentalsCache {
  private cache: Map<string, WasherRental[]> = new Map();
  private maxSize = 30;

  set(date: string, rentals: WasherRental[]): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(date)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(date, rentals);
  }

  get(date: string): WasherRental[] | null {
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
 * Servicio de datos de alquileres
 * Implementa OCP: Open/Closed Principle
 */
export class RentalsDataService implements IRentalsDataService {
  private rentalsCache: RentalsCache;

  constructor(rentalsCache: RentalsCache = new RentalsCache()) {
    this.rentalsCache = rentalsCache;
  }

  async loadRentalsByDate(date: string): Promise<WasherRental[]> {
    const cached = this.rentalsCache.get(date);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('washer_rentals')
      .select('*, customers(name, phone, address)')
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading rentals for date ${date}:`, error);
      throw error;
    }

    const rentals: WasherRental[] = (data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      customerId: r.customer_id,
      customerName: r.customers?.name || r.customer_name,
      customerPhone: r.customers?.phone || r.customer_phone,
      customerAddress: r.customers?.address || r.customer_address,
      machineId: r.machine_id,
      shift: r.shift,
      deliveryTime: r.delivery_time ? r.delivery_time.substring(0, 5) : '',
      pickupTime: r.pickup_time ? r.pickup_time.substring(0, 5) : '',
      pickupDate: r.pickup_date,
      deliveryFee: Number(r.delivery_fee),
      totalUsd: Number(r.total_usd),
      paymentMethod: r.payment_method || 'efectivo',
      status: r.status,
      isPaid: r.is_paid,
      datePaid: r.date_paid || undefined,
      notes: r.notes,
      createdAt: normalizeTimestamp(
        r.created_at ?? r.createdAt,
        getSafeTimestamp()
      ),
      updatedAt: normalizeTimestamp(
        r.updated_at ?? r.updatedAt,
        getSafeTimestamp()
      ),
    }));

    this.rentalsCache.set(date, rentals);

    return rentals;
  }

  clearCache(): void {
    this.rentalsCache.clear();
  }

  invalidateCache(date: string): void {
    this.rentalsCache.delete(date);
  }

  getCachedRentals(date: string): WasherRental[] | null {
    return this.rentalsCache.get(date);
  }

  hasCachedDate(date: string): boolean {
    return this.rentalsCache.has(date);
  }

  async loadRentalsByDates(
    dates: string[]
  ): Promise<Map<string, WasherRental[]>> {
    const results = new Map<string, WasherRental[]>();
    const datesToLoad = dates.filter((date) => !this.rentalsCache.has(date));

    if (datesToLoad.length === 0) {
      for (const date of dates) {
        const cached = this.rentalsCache.get(date);
        if (cached) {
          results.set(date, cached);
        }
      }
      return results;
    }

    const promises = datesToLoad.map(async (date) => {
      const { data, error } = await supabase
        .from('washer_rentals')
        .select('*, customers(name, phone, address)')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading rentals for date ${date}:`, error);
        return { date, rentals: [] };
      }

      const rentals: WasherRental[] = (data || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        customerId: r.customer_id,
        customerName: r.customers?.name || r.customer_name,
        customerPhone: r.customers?.phone || r.customer_phone,
        customerAddress: r.customers?.address || r.customer_address,
        machineId: r.machine_id,
        shift: r.shift,
        deliveryTime: r.delivery_time ? r.delivery_time.substring(0, 5) : '',
        pickupTime: r.pickup_time ? r.pickup_time.substring(0, 5) : '',
        pickupDate: r.pickup_date,
        deliveryFee: Number(r.delivery_fee),
        totalUsd: Number(r.total_usd),
        paymentMethod: r.payment_method || 'efectivo',
        status: r.status,
        isPaid: r.is_paid,
        datePaid: r.date_paid || undefined,
        notes: r.notes,
        createdAt: normalizeTimestamp(
          r.created_at ?? r.createdAt,
          getSafeTimestamp()
        ),
        updatedAt: normalizeTimestamp(
          r.updated_at ?? r.updatedAt,
          getSafeTimestamp()
        ),
      }));

      this.rentalsCache.set(date, rentals);

      return { date, rentals };
    });

    const loadedResults = await Promise.all(promises);

    for (const date of dates) {
      const cached = this.rentalsCache.get(date);
      if (cached) {
        results.set(date, cached);
      }
    }

    return results;
  }

  /**
   * Carga alquileres en un rango de fechas de forma eficiente (1 query)
   */
  async loadRentalsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, WasherRental[]>> {
    const results = new Map<string, WasherRental[]>();
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

    const allCached = datesInRange.every((d) => this.rentalsCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.rentalsCache.get(date) || []);
      }
      return results;
    }

    const { data, error } = await supabase
      .from('washer_rentals')
      .select('*, customers(name, phone, address)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        `Error loading rentals for range ${startDate} to ${endDate}:`,
        error
      );
      throw error;
    }

    const grouped: Record<string, WasherRental[]> = {};
    for (const date of datesInRange) {
      grouped[date] = [];
    }

    (data || []).forEach((r: any) => {
      const dateKey = r.date.substring(0, 10);

      if (grouped[dateKey]) {
        grouped[dateKey].push({
          id: r.id,
          date: dateKey,
          customerId: r.customer_id,
          customerName: r.customers?.name || r.customer_name,
          customerPhone: r.customers?.phone || r.customer_phone,
          customerAddress: r.customers?.address || r.customer_address,
          machineId: r.machine_id,
          shift: r.shift,
          deliveryTime: r.delivery_time
            ? r.delivery_time.substring(0, 5)
            : '',
          pickupTime: r.pickup_time ? r.pickup_time.substring(0, 5) : '',
          pickupDate: r.pickup_date,
          deliveryFee: Number(r.delivery_fee),
          totalUsd: Number(r.total_usd),
          paymentMethod: r.payment_method || 'efectivo',
          status: r.status,
          isPaid: r.is_paid,
          datePaid: r.date_paid || undefined,
          notes: r.notes,
          createdAt: normalizeTimestamp(
            r.created_at ?? r.createdAt,
            getSafeTimestamp()
          ),
          updatedAt: normalizeTimestamp(
            r.updated_at ?? r.updatedAt,
            getSafeTimestamp()
          ),
        });
      }
    });

    for (const date of datesInRange) {
      const rentals = grouped[date] || [];
      this.rentalsCache.set(date, rentals);
      results.set(date, rentals);
    }

    return results;
  }
}

export const rentalsDataService = new RentalsDataService();
