import type { WasherRental } from '@aqua-guest/domain';

export class RentalsCache {
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
}
