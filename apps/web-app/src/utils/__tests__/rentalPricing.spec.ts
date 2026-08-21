import { describe, expect, it } from 'vitest';
import { SHIFT_UUID, type RentalShiftConfig } from '@aqua-guest/domain';
import { calculateRentalPrice } from '../rentalPricing';

const buildCatalog = (): RentalShiftConfig[] => [
  {
    id: 'shift-uuid-1',
    label: 'Personalizado A',
    priceUsd: 10,
    hours: 6,
    hasDivisaDiscount: true,
    divisaDiscountAmount: 3,
    isActive: true,
  },
];

describe('calculateRentalPrice', () => {
  describe('using the dynamic catalog', () => {
    it('returns the base price + delivery fee when no discount applies', () => {
      const price = calculateRentalPrice(
        'shift-uuid-1',
        'efectivo',
        2,
        { dynamicShifts: buildCatalog() }
      );

      expect(price).toBe(12);
    });

    it('applies the divisa discount when configured and payment is divisa', () => {
      const price = calculateRentalPrice(
        'shift-uuid-1',
        'divisa',
        1,
        { dynamicShifts: buildCatalog() }
      );

      // 10 - 3 + 1 = 8
      expect(price).toBe(8);
    });

    it('does not apply the discount for non-divisa payment methods even if the flag is on', () => {
      const price = calculateShiftByMethod('pago_movil');
      expect(price).toBe(12);

      function calculateShiftByMethod(method: 'pago_movil' | 'punto_venta') {
        return calculateRentalPrice('shift-uuid-1', method, 2, {
          dynamicShifts: buildCatalog(),
        });
      }
    });
  });

  describe('using the offline fallback', () => {
    it('resolves the classic "completo" key with its 6 USD base', () => {
      const price = calculateRentalPrice('completo', 'pago_movil', 1);
      expect(price).toBe(7);
    });

    it('subtracts 1 USD when completo is paid in divisa', () => {
      const price = calculateRentalPrice('completo', 'divisa', 1);
      // 6 - 1 + 1 = 6
      expect(price).toBe(6);
    });

    it('resolves the seeded UUIDs identically to the legacy keys', () => {
      expect(calculateRentalPrice(SHIFT_UUID.completo, 'divisa', 0)).toBe(5);
      expect(calculateRentalPrice(SHIFT_UUID.medio, 'efectivo', 0)).toBe(4);
      expect(calculateRentalPrice(SHIFT_UUID.doble, 'efectivo', 0)).toBe(12);
    });
  });

  describe('edge cases', () => {
    it('returns the delivery fee alone when the shift cannot be resolved', () => {
      const price = calculateRentalPrice('unknown-shift', 'efectivo', 5);
      expect(price).toBe(5);
    });

    it('clamps negative results to zero before adding the delivery fee', () => {
      const overDiscounted: RentalShiftConfig[] = [
        {
          id: 'over-discount',
          label: 'over',
          priceUsd: 2,
          hours: 1,
          hasDivisaDiscount: true,
          divisaDiscountAmount: 5,
          isActive: true,
        },
      ];
      const price = calculateRentalPrice('over-discount', 'divisa', 1, {
        dynamicShifts: overDiscounted,
      });
      // base 2 - 5 (clamped to 0) + 1 delivery = 1
      expect(price).toBe(1);
    });
  });
});
