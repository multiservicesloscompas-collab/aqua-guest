import type { Expense } from '@aqua-guest/domain';
import type { ExpensesRepository } from '@aqua-guest/product-domain/frontend';
import { appRepositories } from '@/lib/app-repositories';
import {
  buildDateRangeKeys,
  cacheGroupedDateResults,
  DateKeyedCache,
  projectCachedDates,
} from '@/services/dateRangeDataServiceHelpers';

export interface IExpensesDataService {
  loadExpensesByDate(date: string): Promise<Expense[]>;
  clearCache(): void;
  invalidateCache(date: string): void;
  getCachedExpenses(date: string): Expense[] | null;
  hasCachedDate(date: string): boolean;
  loadExpensesByDateRange(startDate: string, endDate: string): Promise<Map<string, Expense[]>>;
  loadExpensesByDates(dates: string[]): Promise<Map<string, Expense[]>>;
}

interface ExpensesDataServiceDeps {
  expensesRepository: ExpensesRepository;
  expensesCache?: DateKeyedCache<Expense>;
}

export class ExpensesDataService implements IExpensesDataService {
  private readonly expensesRepository: ExpensesRepository;
  private readonly expensesCache: DateKeyedCache<Expense>;

  constructor({
    expensesRepository = appRepositories.expensesRepository,
    expensesCache = new DateKeyedCache<Expense>(),
  }: Partial<ExpensesDataServiceDeps> = {}) {
    this.expensesRepository = expensesRepository;
    this.expensesCache = expensesCache;
  }

  async loadExpensesByDate(date: string): Promise<Expense[]> {
    const cached = this.expensesCache.get(date);
    if (cached) {
      return cached;
    }

    const expenses = await this.expensesRepository.loadByDate(date);
    this.expensesCache.set(date, expenses);
    return expenses;
  }

  async loadExpensesByDates(dates: string[]): Promise<Map<string, Expense[]>> {
    const datesToLoad = dates.filter((date) => !this.expensesCache.has(date));
    if (datesToLoad.length > 0) {
      const loaded = await this.expensesRepository.loadByDates(datesToLoad);
      for (const [date, expenses] of loaded.entries()) {
        this.expensesCache.set(date, expenses);
      }
    }

    return projectCachedDates(dates, this.expensesCache);
  }

  async loadExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, Expense[]>> {
    const datesInRange = buildDateRangeKeys(startDate, endDate);
    if (datesInRange.every((date) => this.expensesCache.has(date))) {
      return projectCachedDates(datesInRange, this.expensesCache);
    }

    const expensesMap = await this.expensesRepository.loadByDateRange(startDate, endDate);

    return cacheGroupedDateResults(
      datesInRange,
      Object.fromEntries(expensesMap.entries()),
      this.expensesCache
    );
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
}

export const expensesDataService = new ExpensesDataService();
