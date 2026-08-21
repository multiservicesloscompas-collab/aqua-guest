export class DateKeyedCache<T> {
  private cache = new Map<string, T[]>();

  constructor(private readonly maxSize = 30) {}

  set(date: string, items: T[]): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(date)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(date, items);
  }

  get(date: string): T[] | null {
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
}

export const buildDateRangeKeys = (
  startDate: string,
  endDate: string
): string[] => {
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

  return datesInRange;
};

export const projectCachedDates = <T>(
  dates: readonly string[],
  cache: Pick<DateKeyedCache<T>, 'get'>
): Map<string, T[]> => {
  const results = new Map<string, T[]>();

  for (const date of dates) {
    const cached = cache.get(date);
    if (cached) {
      results.set(date, cached);
    }
  }

  return results;
};

export const groupItemsByDateRange = <T>(
  dates: readonly string[],
  items: readonly T[],
  getDateKey: (item: T) => string
): Record<string, T[]> => {
  const grouped: Record<string, T[]> = {};

  for (const date of dates) {
    grouped[date] = [];
  }

  for (const item of items) {
    const dateKey = getDateKey(item);
    if (grouped[dateKey]) {
      grouped[dateKey].push(item);
    }
  }

  return grouped;
};

export const cacheGroupedDateResults = <T>(
  dates: readonly string[],
  grouped: Record<string, T[]>,
  cache: Pick<DateKeyedCache<T>, 'set'>
): Map<string, T[]> => {
  const results = new Map<string, T[]>();

  for (const date of dates) {
    const items = grouped[date] || [];
    cache.set(date, items);
    results.set(date, items);
  }

  return results;
};
