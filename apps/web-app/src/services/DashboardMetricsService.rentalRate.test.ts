import { describe, expect, it } from 'vitest';
import { calculateDashboardMetrics } from './DashboardMetricsService';
import type { WasherRental } from '@/types';

function buildPaidRental(overrides: Partial<WasherRental> = {}): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-07',
    customerName: 'Cliente',
    customerPhone: '000',
    customerAddress: 'Dirección',
    machineId: 'm-1',
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
    createdAt: '2026-03-07T11:00:00.000Z',
    updatedAt: '2026-03-07T11:00:00.000Z',
    ...overrides,
  };
}

function metricsFor(rental: WasherRental, exchangeRate: number) {
  return calculateDashboardMetrics({
    selectedDate: '2026-03-07',
    exchangeRate,
    sales: [],
    rentals: [rental],
    expenses: [],
    prepaidOrders: [],
    paymentBalanceTransactions: [],
  });
}

describe('calculateDashboardMetrics rental income vs exchange rate changes', () => {
  it('keeps the amount paid for a rental with a single stored payment when the rate changes', () => {
    // Arrange: $5 paid at 36.5 (Bs 182.50); today's rate moved to 50
    const rental = buildPaidRental({
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 182.5,
          amountUsd: 5,
          exchangeRateUsed: 36.5,
        },
      ],
    });

    // Act
    const { day, mtd } = metricsFor(rental, 50);

    // Assert: income equals what was paid, like the method cards
    expect(day.rentalBs).toBeCloseTo(182.5, 2);
    expect(day.totalIncomeBs).toBeCloseTo(182.5, 2);
    expect(mtd.rentalBs).toBeCloseTo(182.5, 2);
    expect(day.methodTotalsBs.efectivo).toBeCloseTo(182.5, 2);
  });

  it('sums every stored payment of a mixed rental regardless of the current rate', () => {
    // Arrange
    const rental = buildPaidRental({
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 100,
          amountUsd: 2.74,
          exchangeRateUsed: 36.5,
        },
        {
          method: 'pago_movil',
          amountBs: 82.5,
          amountUsd: 2.26,
          exchangeRateUsed: 36.5,
        },
      ],
    });

    // Act
    const { day } = metricsFor(rental, 50);

    // Assert
    expect(day.rentalBs).toBeCloseTo(182.5, 2);
  });

  it('falls back to totalUsd times the current rate when the rental has no stored payments', () => {
    // Arrange
    const rental = buildPaidRental({ paymentSplits: undefined });

    // Act
    const { day } = metricsFor(rental, 50);

    // Assert
    expect(day.rentalBs).toBe(250);
  });
});
