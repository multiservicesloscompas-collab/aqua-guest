import { describe, expect, it } from 'vitest';
import { DateKeyedLruCache } from './DateKeyedLruCache';

describe('DateKeyedLruCache', () => {
  it('returns null for a date that was never stored', () => {
    // Arrange
    const cache = new DateKeyedLruCache<string>();

    // Act
    const result = cache.get('2026-03-01');

    // Assert
    expect(result).toBeNull();
    expect(cache.has('2026-03-01')).toBe(false);
  });

  it('stores and returns the items of a date, including an empty list', () => {
    // Arrange
    const cache = new DateKeyedLruCache<string>();

    // Act
    cache.set('2026-03-01', ['a', 'b']);
    cache.set('2026-03-02', []);

    // Assert
    expect(cache.get('2026-03-01')).toEqual(['a', 'b']);
    expect(cache.get('2026-03-02')).toEqual([]);
    expect(cache.has('2026-03-02')).toBe(true);
  });

  it('evicts the oldest inserted date once the default size of 30 is reached', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>();
    for (let day = 1; day <= 30; day++) {
      cache.set(`2026-01-${String(day).padStart(2, '0')}`, [day]);
    }

    // Act
    cache.set('2026-02-01', [31]);

    // Assert
    expect(cache.has('2026-01-01')).toBe(false);
    expect(cache.has('2026-01-02')).toBe(true);
    expect(cache.has('2026-02-01')).toBe(true);
    expect(Array.from(cache.keys())).toHaveLength(30);
  });

  it('respects a custom max size', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>(2);
    cache.set('2026-03-01', [1]);
    cache.set('2026-03-02', [2]);

    // Act
    cache.set('2026-03-03', [3]);

    // Assert
    expect(Array.from(cache.keys())).toEqual(['2026-03-02', '2026-03-03']);
  });

  it('does not evict when overwriting a date that already exists', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>(2);
    cache.set('2026-03-01', [1]);
    cache.set('2026-03-02', [2]);

    // Act
    cache.set('2026-03-01', [10]);

    // Assert
    expect(cache.get('2026-03-01')).toEqual([10]);
    expect(cache.has('2026-03-02')).toBe(true);
  });

  it('keeps insertion order when a date is overwritten (FIFO, not refreshed)', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>(2);
    cache.set('2026-03-01', [1]);
    cache.set('2026-03-02', [2]);
    cache.set('2026-03-01', [10]);

    // Act
    cache.set('2026-03-03', [3]);

    // Assert
    expect(cache.has('2026-03-01')).toBe(false);
    expect(Array.from(cache.keys())).toEqual(['2026-03-02', '2026-03-03']);
  });

  it('deletes one date and reports whether it existed', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>();
    cache.set('2026-03-01', [1]);

    // Act
    const removed = cache.delete('2026-03-01');
    const removedAgain = cache.delete('2026-03-01');

    // Assert
    expect(removed).toBe(true);
    expect(removedAgain).toBe(false);
    expect(cache.get('2026-03-01')).toBeNull();
  });

  it('clears every date', () => {
    // Arrange
    const cache = new DateKeyedLruCache<number>();
    cache.set('2026-03-01', [1]);
    cache.set('2026-03-02', [2]);

    // Act
    cache.clear();

    // Assert
    expect(Array.from(cache.keys())).toEqual([]);
  });
});
