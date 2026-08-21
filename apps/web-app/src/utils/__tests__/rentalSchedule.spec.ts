import { describe, expect, it } from 'vitest';
import { calculatePickupTime } from '../rentalSchedule';
import type { RentalShiftConfig } from '@aqua-guest/domain';

const buildCatalog = (): RentalShiftConfig[] => [
  {
    id: 'short-shift',
    label: 'Corto',
    priceUsd: 5,
    hours: 4,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 0,
    isActive: true,
  },
];

describe('calculatePickupTime', () => {
  it('returns the same day for a delivery that finishes within business hours', () => {
    // Monday 09:00 + 8h (medio fallback) = Monday 17:00 (within 9-20)
    const result = calculatePickupTime(
      new Date(2026, 6, 13, 9, 0, 0),
      '09:00',
      'medio'
    );

    expect(result.pickupTime).toBe('17:00');
    expect(result.pickupDate).toBe('2026-07-13');
  });

  it('rolls over to the next day when the shift would land outside hours', () => {
    // Saturday 15:00 + 8h = Saturday 23:00 (outside 9-20) → rolls to Sunday 09:00
    const result = calculatePickupTime(
      new Date(2026, 6, 18, 15, 0, 0),
      '15:00',
      'medio'
    );

    expect(result.pickupDate).toBe('2026-07-19');
    expect(result.pickupTime).toBe('09:00');
  });

  it('resolves the duration dynamically from the catalog', () => {
    // Monday 10:00 + 4h (custom) = Monday 14:00 (within 9-20)
    const result = calculatePickupTime(
      new Date(2026, 6, 13, 10, 0, 0),
      '10:00',
      'short-shift',
      buildCatalog()
    );

    expect(result.pickupTime).toBe('14:00');
    expect(result.pickupDate).toBe('2026-07-13');
  });

  it('accepts a raw shifts array as a positional argument for backwards compatibility', () => {
    const result = calculatePickupTime(
      new Date(2026, 6, 13, 10, 0, 0),
      '10:00',
      'short-shift',
      buildCatalog() as ReadonlyArray<RentalShiftConfig>
    );

    expect(result.pickupTime).toBe('14:00');
  });

  it('returns the same date/time when deliveryTime is empty', () => {
    const result = calculatePickupTime(
      new Date(2026, 6, 13, 9, 0, 0),
      '',
      'completo'
    );

    expect(result.pickupTime).toBe('09:00');
    expect(result.pickupDate).toBe('2026-07-13');
  });

  it('returns the same date/time when the shift cannot be resolved', () => {
    const result = calculatePickupTime(
      new Date(2026, 6, 13, 9, 0, 0),
      '09:00',
      'unknown-shift'
    );

    expect(result.pickupTime).toBe('09:00');
    expect(result.pickupDate).toBe('2026-07-13');
  });
});
