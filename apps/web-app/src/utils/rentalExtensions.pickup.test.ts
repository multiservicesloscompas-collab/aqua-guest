import { describe, expect, it } from 'vitest';
import { calculateExtendedPickupTime } from './rentalExtensions';

// Local dates in May 2026 (no daylight-saving change in common time zones).
describe('calculateExtendedPickupTime', () => {
  it('adds the extra hours when the result is inside business hours', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '10:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '12:00', pickupDate: '2026-05-11' });
  });

  it('accepts a result exactly at closing time', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '18:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '20:00', pickupDate: '2026-05-11' });
  });

  it('moves a result after closing to the next day at opening', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '19:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-12' });
  });

  it('moves a result before opening to opening time the same day', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '06:00', 1);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-11' });
  });

  it('accepts a Sunday result exactly at 14:00', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-10', '12:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '14:00', pickupDate: '2026-05-10' });
  });

  it('moves a Sunday result after 14:00 to Monday at opening', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-10', '13:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-11' });
  });

  it('moves a Saturday result after closing to Sunday at opening', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-16', '19:00', 2);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-17' });
  });

  it('moves a result that lands after midnight to opening time that day', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '19:00', 8);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-12' });
  });

  it('does not apply the 13:00 and 14:00 delivery exception', () => {
    // Arrange / Act
    const result = calculateExtendedPickupTime('2026-05-11', '13:00', 8);

    // Assert
    expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-12' });
  });
});
