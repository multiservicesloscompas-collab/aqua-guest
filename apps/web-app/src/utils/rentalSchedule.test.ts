import { describe, expect, it } from 'vitest';
import type { RentalShift } from '@/types';
import { calculatePickupTime, clampToBusinessHours } from './rentalSchedule';

// Local dates in May 2026 (no daylight-saving change in common time zones).
const MONDAY = new Date(2026, 4, 11);
const FRIDAY = new Date(2026, 4, 15);
const SATURDAY = new Date(2026, 4, 16);
const SUNDAY = new Date(2026, 4, 10);

describe('calculatePickupTime', () => {
  describe('inside business hours', () => {
    it('keeps the pickup at delivery plus the shift duration', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '09:00', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '17:00', pickupDate: '2026-05-11' });
    });

    it('accepts a pickup exactly at closing time', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '12:00', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '20:00', pickupDate: '2026-05-11' });
    });

    it('moves a full shift to the same time the next day', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '10:00', 'completo');

      // Assert
      expect(result).toEqual({ pickupTime: '10:00', pickupDate: '2026-05-12' });
    });

    it('moves a double shift two days ahead', () => {
      // Arrange / Act
      const result = calculatePickupTime(FRIDAY, '10:00', 'doble');

      // Assert
      expect(result).toEqual({ pickupTime: '10:00', pickupDate: '2026-05-17' });
    });
  });

  describe('Sunday closing hour', () => {
    it('accepts a Sunday pickup exactly at 14:00', () => {
      // Arrange / Act
      const result = calculatePickupTime(SATURDAY, '14:00', 'completo');

      // Assert
      expect(result).toEqual({ pickupTime: '14:00', pickupDate: '2026-05-17' });
    });

    it('moves a Sunday pickup after 14:00 to Monday at opening', () => {
      // Arrange / Act
      const result = calculatePickupTime(SATURDAY, '15:00', 'completo');

      // Assert
      expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-18' });
    });
  });

  describe('outside business hours', () => {
    it('moves a pickup after closing to the next day at opening', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '15:00', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-12' });
    });

    it('moves a pickup before opening to opening time the same day', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '00:00', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '09:00', pickupDate: '2026-05-11' });
    });
  });

  describe('13:00 and 14:00 deliveries', () => {
    it.each(['13:00', '14:00'])(
      'ends a same-day pickup after closing at 20:00 when delivered at %s',
      (deliveryTime) => {
        // Arrange / Act
        const result = calculatePickupTime(MONDAY, deliveryTime, 'medio');

        // Assert
        expect(result).toEqual({
          pickupTime: '20:00',
          pickupDate: '2026-05-11',
        });
      }
    );

    it('does not apply the exception to other delivery times', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '15:00', 'medio');

      // Assert
      expect(result.pickupTime).toBe('09:00');
      expect(result.pickupDate).toBe('2026-05-12');
    });

    // Pins today's behavior. The business rule is Monday 09:00 (candidate C11);
    // this expectation must flip when that bug is fixed, in its own change.
    it('still ends at 20:00 on a Sunday even though the shop closes at 14:00', () => {
      // Arrange / Act
      const result = calculatePickupTime(SUNDAY, '13:00', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '20:00', pickupDate: '2026-05-10' });
    });
  });

  describe('without enough information', () => {
    it('returns the delivery date at midnight when there is no delivery time', () => {
      // Arrange / Act
      const result = calculatePickupTime(MONDAY, '', 'medio');

      // Assert
      expect(result).toEqual({ pickupTime: '00:00', pickupDate: '2026-05-11' });
    });

    it('returns the delivery date at midnight for an unknown shift', () => {
      // Arrange
      const unknownShift = 'inexistente' as RentalShift;

      // Act
      const result = calculatePickupTime(MONDAY, '10:00', unknownShift);

      // Assert
      expect(result).toEqual({ pickupTime: '00:00', pickupDate: '2026-05-11' });
    });
  });
});

describe('clampToBusinessHours', () => {
  const at = (day: Date, hour: number, minute = 0) =>
    new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);

  it('returns the same moment when it is inside business hours', () => {
    // Arrange
    const moment = at(MONDAY, 15, 30);

    // Act
    const result = clampToBusinessHours(moment);

    // Assert
    expect(result.getTime()).toBe(moment.getTime());
  });

  it('accepts the exact opening and closing moments', () => {
    // Arrange
    const opening = at(MONDAY, 9);
    const closing = at(MONDAY, 20);

    // Act / Assert
    expect(clampToBusinessHours(opening).getTime()).toBe(opening.getTime());
    expect(clampToBusinessHours(closing).getTime()).toBe(closing.getTime());
  });

  it('moves a moment before opening to opening time the same day', () => {
    // Arrange
    const moment = at(MONDAY, 7, 45);

    // Act
    const result = clampToBusinessHours(moment);

    // Assert
    expect(result.getTime()).toBe(at(MONDAY, 9).getTime());
  });

  it('moves a moment after closing to opening time the next day', () => {
    // Arrange
    const moment = at(MONDAY, 20, 1);

    // Act
    const result = clampToBusinessHours(moment);

    // Assert
    expect(result.getTime()).toBe(at(new Date(2026, 4, 12), 9).getTime());
  });

  it('closes at 14:00 on Sunday', () => {
    // Arrange
    const beforeClose = at(SUNDAY, 14);
    const afterClose = at(SUNDAY, 14, 1);

    // Act / Assert
    expect(clampToBusinessHours(beforeClose).getTime()).toBe(
      beforeClose.getTime()
    );
    expect(clampToBusinessHours(afterClose).getTime()).toBe(
      at(new Date(2026, 4, 11), 9).getTime()
    );
  });

  it('moves a Saturday moment after closing to Sunday at opening', () => {
    // Arrange
    const moment = at(SATURDAY, 21);

    // Act
    const result = clampToBusinessHours(moment);

    // Assert
    expect(result.getTime()).toBe(at(new Date(2026, 4, 17), 9).getTime());
  });
});
