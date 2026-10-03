import { describe, expect, it } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  PAYMENT_METHOD,
  PAYMENT_METHODS,
  RENTAL_SHIFT,
  LEGACY_RENTAL_SHIFTS,
  type PaymentMethod,
  type RentalShift,
} from '@aqua-guest/domain';
import {
  calculateRentalPrice,
  calculateRentalSubtotalUsd,
  calculateShiftBasePrice,
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
    expect(LEGACY_RENTAL_SHIFTS).toEqual(['medio', 'completo', 'doble']);
    expect(PAYMENT_METHODS).toEqual([
      'efectivo',
      'pago_movil',
      'punto_venta',
      'divisa',
    ]);
  });

  it('keys each legacy definition by its own id', () => {
    LEGACY_RENTAL_SHIFTS.forEach((shift) => {
      expect(LEGACY_SHIFT_DEFINITIONS[shift].id).toBe(shift);
    });
  });
});

describe('calculateRentalPrice (characterization)', () => {
  LEGACY_RENTAL_SHIFTS.forEach((shift) => {
    it.each(PAYMENT_METHODS)(
      `charges the historical price for ${shift} paid with %s`,
      (paymentMethod) => {
        // Arrange
        const deliveryFee = 2;

        // Act
        const total = calculateRentalPrice(
          LEGACY_SHIFT_DEFINITIONS[shift],
          paymentMethod,
          deliveryFee
        );

        // Assert
        expect(total).toBe(EXPECTED_BASE_PRICE[shift][paymentMethod] + 2);
      }
    );
  });
});

describe('calculateShiftBasePrice', () => {
  it.each(LEGACY_RENTAL_SHIFTS)(
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
  const baseRental = {
    shift: completo,
    paymentMethod: divisa,
    deliveryFee: 2,
    totalUsd: 7,
    shiftSnapshot: undefined,
  };

  it('adds the delivery fee to the shift price for the rental payment method', () => {
    // Arrange / Act
    const subtotal = calculateRentalSubtotalUsd(baseRental);

    // Assert
    expect(subtotal).toBe(7);
  });

  it('treats a missing delivery fee as zero', () => {
    // Arrange
    const rental = {
      ...baseRental,
      shift: medio,
      paymentMethod: efectivo,
      deliveryFee: undefined,
    };

    // Act / Assert
    expect(calculateRentalSubtotalUsd(rental)).toBe(4);
  });

  it('matches calculateRentalPrice for every shift and payment method', () => {
    // Arrange / Act / Assert
    LEGACY_RENTAL_SHIFTS.forEach((shift) => {
      PAYMENT_METHODS.forEach((paymentMethod) => {
        expect(
          calculateRentalSubtotalUsd({
            ...baseRental,
            shift,
            paymentMethod,
            deliveryFee: 3,
          })
        ).toBe(
          calculateRentalPrice(
            LEGACY_SHIFT_DEFINITIONS[shift],
            paymentMethod,
            3
          )
        );
      });
    });
  });

  it('prices with the snapshot stored in the rental, not with the current shift', () => {
    // Arrange
    const rental = {
      ...baseRental,
      shift: doble,
      paymentMethod: efectivo,
      deliveryFee: 1,
      shiftSnapshot: {
        ...LEGACY_SHIFT_DEFINITIONS[doble],
        priceUsd: 10,
      },
    };

    // Act
    const subtotal = calculateRentalSubtotalUsd(rental);

    // Assert
    expect(subtotal).toBe(11);
  });

  it('applies the snapshot divisa discount of the rental', () => {
    // Arrange
    const rental = {
      ...baseRental,
      shift: doble,
      paymentMethod: divisa,
      deliveryFee: 0,
      shiftSnapshot: {
        ...LEGACY_SHIFT_DEFINITIONS[doble],
        priceUsd: 10,
        divisaDiscountUsd: 3,
      },
    };

    // Act / Assert
    expect(calculateRentalSubtotalUsd(rental)).toBe(7);
  });
});
