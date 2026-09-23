import { describe, expect, it } from 'vitest';
import type { PaymentSplit, Sale, SplitAware, WasherRental } from '@aqua-guest/domain';
import {
  getExpenseAmountForMethodBs,
  getRentalAmountForMethodBs,
  getRentalAmountForMethodUsd,
  getSaleAmountForMethodBs,
  getSaleAmountForMethodUsd,
  includesMethodInExpense,
  includesMethodInSale,
} from './paymentSplitAttribution';
import type { Expense } from '@aqua-guest/domain';

const changeSplits: PaymentSplit[] = [
  { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
  { method: 'divisa', amountBs: -3400, amountUsd: -4, kind: 'change' },
  { method: 'efectivo', amountBs: -250, amountUsd: -0.29, kind: 'change' },
];

function buildSale(overrides: Partial<SplitAware<Sale>> = {}): SplitAware<Sale> {
  return {
    id: 'sale-1',
    dailyNumber: 3,
    date: '2026-08-21',
    items: [],
    paymentMethod: 'divisa',
    totalBs: 600,
    totalUsd: 0.71,
    exchangeRate: 850,
    createdAt: '2026-08-21T13:55:00.000Z',
    updatedAt: '2026-08-21T13:55:00.000Z',
    ...overrides,
  };
}

describe('getSaleAmountForMethodBs — divisa payment with change', () => {
  const sale = buildSale({ paymentSplits: changeSplits });

  it('sums every divisa row (the tendered bill and the change given back)', () => {
    expect(getSaleAmountForMethodBs(sale, 'divisa')).toBe(850);
  });

  it('reports the change leg as a negative amount for the remainder method', () => {
    expect(getSaleAmountForMethodBs(sale, 'efectivo')).toBe(-250);
  });

  it('reports zero for a method not present in any split', () => {
    expect(getSaleAmountForMethodBs(sale, 'punto_venta')).toBe(0);
  });

  it('sums to the sale total across all four methods', () => {
    const total =
      getSaleAmountForMethodBs(sale, 'efectivo') +
      getSaleAmountForMethodBs(sale, 'pago_movil') +
      getSaleAmountForMethodBs(sale, 'punto_venta') +
      getSaleAmountForMethodBs(sale, 'divisa');

    expect(total).toBe(sale.totalBs);
  });
});

describe('getSaleAmountForMethodUsd — divisa payment with change', () => {
  const sale = buildSale({ paymentSplits: changeSplits });

  it('sums the stored USD amounts for divisa', () => {
    expect(getSaleAmountForMethodUsd(sale, 'divisa', 850)).toBeCloseTo(1, 5);
  });
});

describe('includesMethodInSale — divisa payment with change', () => {
  const sale = buildSale({ paymentSplits: changeSplits });

  it('includes divisa and the change-remainder method', () => {
    expect(includesMethodInSale(sale, 'divisa')).toBe(true);
    expect(includesMethodInSale(sale, 'efectivo')).toBe(true);
  });

  it('excludes a method that never appears', () => {
    expect(includesMethodInSale(sale, 'punto_venta')).toBe(false);
  });
});

describe('getRentalAmountForMethodBs — divisa payment with change', () => {
  function buildRental(
    overrides: Partial<SplitAware<WasherRental>> = {}
  ): SplitAware<WasherRental> {
    return {
      id: 'rental-1',
      date: '2026-08-21',
      customerName: 'Cliente',
      customerPhone: '000',
      customerAddress: 'Dirección',
      machineId: 'm-1',
      shift: 'medio',
      deliveryTime: '10:00',
      pickupTime: '18:00',
      pickupDate: '2026-08-21',
      deliveryFee: 0,
      totalUsd: 0.71,
      paymentMethod: 'divisa',
      status: 'finalizado',
      isPaid: true,
      createdAt: '2026-08-21T13:55:00.000Z',
      updatedAt: '2026-08-21T13:55:00.000Z',
      ...overrides,
    };
  }

  it('sums all rows for the same method', () => {
    const rental = buildRental({ paymentSplits: changeSplits });
    expect(getRentalAmountForMethodBs(rental, 'divisa', 850)).toBe(850);
    expect(getRentalAmountForMethodBs(rental, 'efectivo', 850)).toBe(-250);
  });

  it('sums the USD amounts for divisa', () => {
    const rental = buildRental({ paymentSplits: changeSplits });
    expect(getRentalAmountForMethodUsd(rental, 'divisa', 850)).toBeCloseTo(
      1,
      5
    );
  });
});

describe('Expenses attribution stays on the strict mixed-payment gate', () => {
  function buildExpense(overrides: Partial<Expense> = {}): Expense {
    return {
      id: 'expense-1',
      date: '2026-08-21',
      description: 'Detergente',
      amount: 100,
      category: 'insumos',
      paymentMethod: 'efectivo',
      createdAt: '2026-08-21T10:00:00.000Z',
      ...overrides,
    };
  }

  it('does not attribute a negative amount even if one were ever present', () => {
    const expense = buildExpense({
      paymentSplits: [
        { method: 'efectivo', amountBs: 100 },
        { method: 'pago_movil', amountBs: 50 },
      ],
    });

    expect(getExpenseAmountForMethodBs(expense, 'efectivo')).toBe(100);
    expect(includesMethodInExpense(expense, 'pago_movil')).toBe(true);
  });

  it('falls back to the legacy paymentMethod when splits are absent', () => {
    const expense = buildExpense();
    expect(getExpenseAmountForMethodBs(expense, 'efectivo')).toBe(100);
    expect(getExpenseAmountForMethodBs(expense, 'pago_movil')).toBe(0);
  });
});
