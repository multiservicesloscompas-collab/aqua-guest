import { describe, expect, it } from 'vitest';
import {
  getRentalAmountForMethodBs,
  getRentalAmountForMethodUsd,
  includesMethodInRental,
} from './paymentSplitAttribution';
import type { WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';

function buildRental(paymentSplits?: PaymentSplit[]): WasherRental & {
  paymentSplits?: PaymentSplit[];
} {
  return {
    id: 'rental-1',
    date: '2026-03-07',
    customerName: 'Cliente',
    customerPhone: '000',
    customerAddress: 'Dir',
    machineId: 'm1',
    shift: 'completo',
    deliveryTime: '09:00',
    pickupTime: '18:00',
    pickupDate: '2026-03-08',
    deliveryFee: 0,
    totalUsd: 5,
    paymentMethod: 'efectivo',
    status: 'finalizado',
    isPaid: true,
    datePaid: '2026-03-07',
    createdAt: '2026-03-07T09:00:00.000Z',
    updatedAt: '2026-03-07T09:00:00.000Z',
    paymentSplits,
  };
}

const SINGLE_SPLIT: PaymentSplit[] = [
  { method: 'efectivo', amountBs: 182.5, amountUsd: 5, exchangeRateUsed: 36.5 },
];

describe('rental attribution vs exchange rate changes', () => {
  it('uses the stored amount for a rental with a single stored payment', () => {
    // Arrange: $5 paid at 36.5; today's rate is 50
    const rental = buildRental(SINGLE_SPLIT);

    // Act
    const bs = getRentalAmountForMethodBs(rental, 'efectivo', 50);
    const usd = getRentalAmountForMethodUsd(rental, 'efectivo', 50);

    // Assert
    expect(bs).toBeCloseTo(182.5, 2);
    expect(usd).toBe(5);
  });

  it('attributes a single stored payment to the method it was paid with', () => {
    // Arrange: the rental header says efectivo but the stored payment is pago móvil
    const rental = buildRental([{ ...SINGLE_SPLIT[0], method: 'pago_movil' }]);

    // Act / Assert
    expect(includesMethodInRental(rental, 'pago_movil')).toBe(true);
    expect(includesMethodInRental(rental, 'efectivo')).toBe(false);
    expect(getRentalAmountForMethodBs(rental, 'efectivo', 50)).toBe(0);
    expect(getRentalAmountForMethodBs(rental, 'pago_movil', 50)).toBeCloseTo(
      182.5,
      2
    );
  });

  it('sums every stored payment of the requested method', () => {
    // Arrange
    const rental = buildRental([
      {
        method: 'efectivo',
        amountBs: 100,
        amountUsd: 2.74,
        exchangeRateUsed: 36.5,
      },
      {
        method: 'efectivo',
        amountBs: 82.5,
        amountUsd: 2.26,
        exchangeRateUsed: 36.5,
      },
    ]);

    // Act
    const bs = getRentalAmountForMethodBs(rental, 'efectivo', 50);

    // Assert
    expect(bs).toBeCloseTo(182.5, 2);
  });

  it('falls back to totalUsd times the current rate without stored payments', () => {
    // Arrange
    const rental = buildRental(undefined);

    // Act / Assert
    expect(getRentalAmountForMethodBs(rental, 'efectivo', 50)).toBe(250);
    expect(getRentalAmountForMethodBs(rental, 'pago_movil', 50)).toBe(0);
  });
});
