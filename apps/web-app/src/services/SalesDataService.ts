import type { Sale } from '@aqua-guest/domain';
import type { SalesRepository } from '@aqua-guest/product-domain/frontend';
import { appRepositories } from '@/lib/app-repositories';
import {
  buildDateRangeKeys,
  cacheGroupedDateResults,
  DateKeyedCache,
  projectCachedDates,
} from '@/services/dateRangeDataServiceHelpers';

export interface ISalesDataService {
  loadSalesByDate(date: string): Promise<Sale[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedSales(date: string): Sale[] | null;
  hasCachedDate(date: string): boolean;
  loadSalesByDateRange(startDate: string, endDate: string): Promise<Map<string, Sale[]>>;
  loadSalesByDates(dates: string[]): Promise<Map<string, Sale[]>>;
}

interface SalesDataServiceDeps {
  salesRepository: SalesRepository;
  salesCache?: DateKeyedCache<Sale>;
}

export class SalesDataService implements ISalesDataService {
  private readonly salesRepository: SalesRepository;
  private readonly salesCache: DateKeyedCache<Sale>;

  constructor({
    salesRepository = appRepositories.salesRepository,
    salesCache = new DateKeyedCache<Sale>(),
  }: Partial<SalesDataServiceDeps> = {}) {
    this.salesRepository = salesRepository;
    this.salesCache = salesCache;
  }

  async loadSalesByDate(date: string): Promise<Sale[]> {
    const cached = this.salesCache.get(date);
    if (cached) {
      return cached;
    }

    const sales = await this.salesRepository.loadByDate(date);
    this.salesCache.set(date, sales);
    return sales;
  }

  async loadSalesByDates(dates: string[]): Promise<Map<string, Sale[]>> {
    const datesToLoad = dates.filter((date) => !this.salesCache.has(date));
    if (datesToLoad.length > 0) {
      const loaded = await this.salesRepository.loadByDates(datesToLoad);
      for (const [date, sales] of loaded.entries()) {
        this.salesCache.set(date, sales);
      }
    }

    return projectCachedDates(dates, this.salesCache);
  }

  async loadSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Sale[]>> {
    const datesInRange = buildDateRangeKeys(startDate, endDate);
    if (datesInRange.every((date) => this.salesCache.has(date))) {
      return projectCachedDates(datesInRange, this.salesCache);
    }

    const salesMap = await this.salesRepository.loadByDateRange(startDate, endDate);

    return cacheGroupedDateResults(
      datesInRange,
      Object.fromEntries(salesMap.entries()),
      this.salesCache
    );
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
}

export const salesDataService = new SalesDataService();
