import { describe, expect, it } from 'vitest';
import { buildTransactionsSummaryItems } from './buildTransactionsSummaryItems';
import type { WasherRental } from '@/types';

function buildPaidRental(overrides: Partial<WasherRental> = {}): WasherRental {
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
    ...overrides,
  };
}

function rentalRows(rental: WasherRental, exchangeRate: number) {
  return buildTransactionsSummaryItems({
    selectedDate: '2026-03-07',
    exchangeRate,
    sales: [],
    rentals: [rental],
    expenses: [],
    prepaidOrders: [],
    paymentBalanceTransactions: [],
  }).filter((item) => item.type === 'rental');
}

describe('buildTransactionsSummaryItems rental amount vs exchange rate changes', () => {
  it('shows the amount paid for a rental with a single stored payment', () => {
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
    const rows = rentalRows(rental, 50);

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0].amountBs).toBeCloseTo(182.5, 2);
    expect(rows[0].amountUsd).toBe(5);
  });

  it('falls back to totalUsd times the current rate when the rental has no stored payments', () => {
    // Arrange
    const rental = buildPaidRental({ paymentSplits: undefined });

    // Act
    const rows = rentalRows(rental, 50);

    // Assert
    expect(rows).toHaveLength(1);
    expect(rows[0].amountBs).toBe(250);
  });
});
