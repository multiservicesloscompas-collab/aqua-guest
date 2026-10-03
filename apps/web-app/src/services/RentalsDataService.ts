import { supabase } from '@/lib/supabaseClient';
import { WasherRental } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import { getDatesInRange } from '@/services/DateService';
import { DateKeyedLruCache } from '@/services/cache/DateKeyedLruCache';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import type { RentalReadRow } from '@/services/rentals/rentalSchemaContract';
import { fromShiftSnapshotColumns } from '@/services/rentals/rentalShiftSnapshot';
import { rentalPaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';

const RENTALS_SELECT = `*, customers(name, phone, address), ${PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable}(payment_method, amount_bs, amount_usd, exchange_rate_used)`;

function toRentalRow(r: RentalReadRow): WasherRental {
  const rawSplits =
    r.rental_payment_splits ?? r.payment_splits ?? r.splits ?? [];
  const splits = rentalPaymentSplitAdapter.fromRows(rawSplits);

  return {
    id: r.id,
    date: r.date.substring(0, 10),
    customerId: r.customer_id,
    customerName: r.customers?.name || r.customer_name || '',
    customerPhone: r.customers?.phone || r.customer_phone || '',
    customerAddress: r.customers?.address || r.customer_address || '',
    machineId: r.machine_id,
    shift: r.shift,
    shiftSnapshot: fromShiftSnapshotColumns(r.shift, r),
    deliveryTime: r.delivery_time ? r.delivery_time.substring(0, 5) : '',
    pickupTime: r.pickup_time ? r.pickup_time.substring(0, 5) : '',
    pickupDate: r.pickup_date,
    deliveryFee: Number(r.delivery_fee),
    totalUsd: Number(r.total_usd),
    paymentMethod: r.payment_method || 'efectivo',
    paymentSplits: splits.length ? splits : undefined,
    status: r.status,
    isPaid: r.is_paid,
    datePaid: r.date_paid ? r.date_paid.substring(0, 10) : undefined,
    notes: r.notes,
    createdAt: normalizeTimestamp(
      r.created_at ?? r.createdAt,
      getSafeTimestamp()
    ),
    updatedAt: normalizeTimestamp(
      r.updated_at ?? r.updatedAt,
      getSafeTimestamp()
    ),
  };
}

export interface IRentalsDataService {
  loadRentalsByDate(date: string): Promise<WasherRental[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedRentals(date: string): WasherRental[] | null;
  hasCachedDate(date: string): boolean;
  loadRentalsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, WasherRental[]>>;
}

export class RentalsDataService implements IRentalsDataService {
  private rentalsCache: DateKeyedLruCache<WasherRental>;

  constructor(
    rentalsCache: DateKeyedLruCache<WasherRental> = new DateKeyedLruCache<WasherRental>()
  ) {
    this.rentalsCache = rentalsCache;
  }

  async loadRentalsByDate(date: string): Promise<WasherRental[]> {
    const cached = this.rentalsCache.get(date);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('washer_rentals')
      .select(RENTALS_SELECT)
      .lte('date', date)
      .gte('pickup_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading rentals for date ${date}:`, error);
      throw error;
    }

    const rentals: WasherRental[] = (data || []).map((r) =>
      toRentalRow(r as unknown as RentalReadRow)
    );

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
        .select(RENTALS_SELECT)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`Error loading rentals for date ${date}:`, error);
        return { date, rentals: [] };
      }

      const rentals: WasherRental[] = (data || []).map((r) =>
        toRentalRow(r as unknown as RentalReadRow)
      );

      this.rentalsCache.set(date, rentals);

      return { date, rentals };
    });

    await Promise.all(promises);

    for (const date of dates) {
      const cached = this.rentalsCache.get(date);
      if (cached) {
        results.set(date, cached);
      }
    }

    return results;
  }

  async loadRentalsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, WasherRental[]>> {
    const results = new Map<string, WasherRental[]>();
    const datesInRange = getDatesInRange(startDate, endDate);

    const allCached = datesInRange.every((d) => this.rentalsCache.has(d));

    if (allCached) {
      for (const date of datesInRange) {
        results.set(date, this.rentalsCache.get(date) || []);
      }
      return results;
    }

    const { data, error } = await supabase
      .from('washer_rentals')
      .select(RENTALS_SELECT)
      .or(
        `and(date.gte.${startDate},date.lte.${endDate}),and(date_paid.gte.${startDate},date_paid.lte.${endDate})`
      )
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

    (data || []).forEach((item) => {
      const r = item as unknown as RentalReadRow;
      // Agrupar por fecha de servicio (date)
      const dateKey = r.date.substring(0, 10);

      if (!grouped[dateKey]) grouped[dateKey] = [];

      grouped[dateKey].push(toRentalRow(r));
    });

    for (const date of Object.keys(grouped)) {
      const rentals = grouped[date];
      this.rentalsCache.set(date, rentals);
      results.set(date, rentals);
    }

    return results;
  }
}

export const rentalsDataService = new RentalsDataService();
