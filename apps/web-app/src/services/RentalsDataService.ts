import type { WasherRental } from '@aqua-guest/domain';
import type { WasherRentalsRepository } from '@aqua-guest/product-domain/frontend';
import { appRepositories } from '@/lib/app-repositories';
import { RentalsCache } from '@/services/rentalsDataService.cache';
import {
  buildDateRangeKeys,
  cacheGroupedDateResults,
  projectCachedDates,
} from '@/services/dateRangeDataServiceHelpers';

export interface IRentalsDataService {
  loadRentalsByDate(date: string): Promise<WasherRental[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedRentals(date: string): WasherRental[] | null;
  hasCachedDate(date: string): boolean;
  loadRentalsByDateRange(startDate: string, endDate: string): Promise<Map<string, WasherRental[]>>;
  loadRentalsByDates(dates: string[]): Promise<Map<string, WasherRental[]>>;
}

interface RentalsDataServiceDeps {
  washerRentalsRepository: WasherRentalsRepository;
  rentalsCache?: RentalsCache;
}

export class RentalsDataService implements IRentalsDataService {
  private readonly washerRentalsRepository: WasherRentalsRepository;
  private readonly rentalsCache: RentalsCache;

  constructor({
    washerRentalsRepository = appRepositories.washerRentalsRepository,
    rentalsCache = new RentalsCache(),
  }: Partial<RentalsDataServiceDeps> = {}) {
    this.washerRentalsRepository = washerRentalsRepository;
    this.rentalsCache = rentalsCache;
  }

  async loadRentalsByDate(date: string): Promise<WasherRental[]> {
    const cached = this.rentalsCache.get(date);
    if (cached) {
      return cached;
    }

    const rentals = await this.washerRentalsRepository.loadByDate(date);
    this.rentalsCache.set(date, rentals);
    return rentals;
  }

  async loadRentalsByDates(dates: string[]): Promise<Map<string, WasherRental[]>> {
    const datesToLoad = dates.filter((date) => !this.rentalsCache.has(date));
    if (datesToLoad.length > 0) {
      const loaded = await this.washerRentalsRepository.loadByDates(datesToLoad);
      for (const [date, rentals] of loaded.entries()) {
        this.rentalsCache.set(date, rentals);
      }
    }

    return projectCachedDates(dates, this.rentalsCache);
  }

  async loadRentalsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, WasherRental[]>> {
    const datesInRange = buildDateRangeKeys(startDate, endDate);
    if (datesInRange.every((date) => this.rentalsCache.has(date))) {
      return projectCachedDates(datesInRange, this.rentalsCache);
    }

    const rentalsMap = await this.washerRentalsRepository.loadByDateRange(
      startDate,
      endDate
    );

    return cacheGroupedDateResults(
      datesInRange,
      Object.fromEntries(rentalsMap.entries()),
      this.rentalsCache
    );
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
}

export const rentalsDataService = new RentalsDataService();
