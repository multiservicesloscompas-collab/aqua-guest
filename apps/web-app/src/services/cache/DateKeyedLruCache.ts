export class DateKeyedLruCache<T> {
  private cache: Map<string, T[]> = new Map();

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

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}
