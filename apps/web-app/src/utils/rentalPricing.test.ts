import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  PAYMENT_METHOD,
  PAYMENT_METHODS,
  RENTAL_SHIFT,
  RENTAL_SHIFTS,
  type PaymentMethod,
  type RentalShift,
} from '@aqua-guest/domain';
import {
  calculateRentalPrice,
  calculateRentalSubtotalUsd,
  calculateShiftBasePrice,
  getBaseRentalPrice,
} from './rentalPricing';

const { medio, completo, doble } = RENTAL_SHIFT;
const { pago_movil, efectivo, punto_venta, divisa } = PAYMENT_METHOD;

const EXPECTED_BASE_PRICE: Record<
  RentalShift,
  Record<PaymentMethod, number>
> = {
  [medio]: {
    [pago_movil]: 4,
    [efectivo]: 4,
    [punto_venta]: 4,
    [divisa]: 4,
  },
  [completo]: {
    [pago_movil]: 6,
    [efectivo]: 6,
    [punto_venta]: 6,
    [divisa]: 5,
  },
  [doble]: {
    [pago_movil]: 12,
    [efectivo]: 12,
    [punto_venta]: 12,
    [divisa]: 12,
  },
};

describe('domain constants', () => {
  it('lists every shift and payment method once', () => {
    expect(RENTAL_SHIFTS).toEqual(['medio', 'completo', 'doble']);
    expect(PAYMENT_METHODS).toEqual([
      'pago_movil',
      'efectivo',
      'punto_venta',
      'divisa',
    ]);
  });

  it('keys each legacy definition by its own id', () => {
    RENTAL_SHIFTS.forEach((shift) => {
      expect(LEGACY_SHIFT_DEFINITIONS[shift].id).toBe(shift);
    });
  });
});

describe('calculateRentalPrice (characterization)', () => {
  RENTAL_SHIFTS.forEach((shift) => {
    it.each(PAYMENT_METHODS)(
      `charges the historical price for ${shift} paid with %s`,
      (paymentMethod) => {
        // Arrange
        const deliveryFee = 2;

        // Act
        const total = calculateRentalPrice(shift, paymentMethod, deliveryFee);

        // Assert
        expect(total).toBe(EXPECTED_BASE_PRICE[shift][paymentMethod] + 2);
      }
    );
  });

  it('keeps getBaseRentalPrice as the undiscounted list price', () => {
    // Arrange / Act / Assert
    expect(getBaseRentalPrice(completo)).toBe(6);
  });
});

describe('calculateShiftBasePrice', () => {
  it.each(RENTAL_SHIFTS)(
    'matches the historical price table for %s',
    (shift) => {
      // Arrange
      const definition = LEGACY_SHIFT_DEFINITIONS[shift];

      // Act / Assert
      PAYMENT_METHODS.forEach((paymentMethod) => {
        expect(calculateShiftBasePrice(definition, paymentMethod)).toBe(
          EXPECTED_BASE_PRICE[shift][paymentMethod]
        );
      });
    }
  );

  it('applies the discount only when paying in divisa', () => {
    // Arrange
    const definition = {
      ...LEGACY_SHIFT_DEFINITIONS[doble],
      divisaDiscountUsd: 2,
    };

    // Act / Assert
    expect(calculateShiftBasePrice(definition, divisa)).toBe(10);
    expect(calculateShiftBasePrice(definition, efectivo)).toBe(12);
  });

  it('never returns a negative price when the discount exceeds the price', () => {
    // Arrange
    const definition = {
      ...LEGACY_SHIFT_DEFINITIONS[medio],
      divisaDiscountUsd: 99,
    };

    // Act / Assert
    expect(calculateShiftBasePrice(definition, divisa)).toBe(0);
  });
});

describe('calculateRentalSubtotalUsd', () => {
  it('adds the delivery fee to the shift price for the rental payment method', () => {
    // Arrange
    const rental = { shift: completo, paymentMethod: divisa, deliveryFee: 2 };

    // Act
    const subtotal = calculateRentalSubtotalUsd(rental);

    // Assert
    expect(subtotal).toBe(7);
  });

  it('treats a missing delivery fee as zero', () => {
    // Arrange
    const rental = {
      shift: medio,
      paymentMethod: efectivo,
      deliveryFee: undefined,
    };

    // Act / Assert
    expect(calculateRentalSubtotalUsd(rental)).toBe(4);
  });

  it('matches calculateRentalPrice for every shift and payment method', () => {
    // Arrange / Act / Assert
    RENTAL_SHIFTS.forEach((shift) => {
      PAYMENT_METHODS.forEach((paymentMethod) => {
        expect(
          calculateRentalSubtotalUsd({ shift, paymentMethod, deliveryFee: 3 })
        ).toBe(calculateRentalPrice(shift, paymentMethod, 3));
      });
    });
  });
});
