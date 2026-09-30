import { describe, expect, it } from 'vitest';
import { getDatesInRange } from './DateService';

describe('getDatesInRange', () => {
  it('returns a single date when start and end are the same day', () => {
    // Arrange
    const start = '2026-03-15';
    const end = '2026-03-15';

    // Act
    const result = getDatesInRange(start, end);

    // Assert
    expect(result).toEqual(['2026-03-15']);
  });

  it('includes both endpoints for a range inside one month', () => {
    // Arrange / Act
    const result = getDatesInRange('2026-03-10', '2026-03-13');

    // Assert
    expect(result).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
    ]);
  });

  it('rolls over to the next month', () => {
    // Arrange / Act
    const result = getDatesInRange('2026-04-29', '2026-05-02');

    // Assert
    expect(result).toEqual([
      '2026-04-29',
      '2026-04-30',
      '2026-05-01',
      '2026-05-02',
    ]);
  });

  it('rolls over to the next year', () => {
    // Arrange / Act
    const result = getDatesInRange('2025-12-30', '2026-01-02');

    // Assert
    expect(result).toEqual([
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ]);
  });

  it('includes February 29 in a leap year and skips it otherwise', () => {
    // Arrange / Act
    const leap = getDatesInRange('2028-02-28', '2028-03-01');
    const common = getDatesInRange('2027-02-28', '2027-03-01');

    // Assert
    expect(leap).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    expect(common).toEqual(['2027-02-28', '2027-03-01']);
  });

  it('returns an empty list when start is after end', () => {
    // Arrange / Act
    const result = getDatesInRange('2026-03-15', '2026-03-10');

    // Assert
    expect(result).toEqual([]);
  });

  it('returns one entry per day for a full 31-day month', () => {
    // Arrange / Act
    const result = getDatesInRange('2026-01-01', '2026-01-31');

    // Assert
    expect(result).toHaveLength(31);
    expect(result[0]).toBe('2026-01-01');
    expect(result[30]).toBe('2026-01-31');
  });
});
