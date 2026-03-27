import { describe, expect, it } from 'vitest';
import type { Sale, WasherRental } from '@/types';
import {
  buildRentalPaymentDisplayModel,
  buildSalePaymentDisplayModel,
} from './paymentDisplayModel';
import { hasValidMixedPaymentSplits } from './paymentSplitValidity';

function createBaseSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    dailyNumber: 1,
    date: '2026-03-10',
    items: [],
    paymentMethod: 'efectivo',
    totalBs: 100,
    totalUsd: 2,
    exchangeRate: 50,
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
    ...overrides,
  };
}

function createBaseRental(overrides: Partial<WasherRental> = {}): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-10',
    customerName: 'Cliente',
    customerPhone: '000',
    customerAddress: 'Dir',
    machineId: 'm-1',
    shift: 'medio',
    deliveryTime: '10:00',
    pickupTime: '18:00',
    pickupDate: '2026-03-10',
    deliveryFee: 0,
    totalUsd: 4,
    paymentMethod: 'divisa',
    status: 'enviado',
    isPaid: true,
    datePaid: '2026-03-10',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('paymentDisplayModel', () => {
  it('builds mixed model for sale with two valid split methods', () => {
    const sale = createBaseSale({
      paymentMethod: 'punto_venta',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 70,
          amountUsd: 1.4,
          exchangeRateUsed: 50,
        },
        {
          method: 'pago_movil',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
        },
      ],
    });

    const model = buildSalePaymentDisplayModel(sale);

    expect(model.kind).toBe('mixed');
    expect(model.label).toBe('Pago mixto');
    expect(model.lines).toHaveLength(2);
    expect(model.lines.map((line) => line.method)).toEqual([
      'efectivo',
      'pago_movil',
    ]);
    expect(model.totalBs).toBe(100);
  });

  it('builds mixed model for rental with two valid split methods', () => {
    const rental = createBaseRental({
      paymentSplits: [
        {
          method: 'divisa',
          amountBs: 150,
          amountUsd: 3,
          exchangeRateUsed: 50,
        },
        {
          method: 'efectivo',
          amountBs: 50,
          amountUsd: 1,
          exchangeRateUsed: 50,
        },
      ],
    });

    const model = buildRentalPaymentDisplayModel(rental, 50);

    expect(model.kind).toBe('mixed');
    expect(model.lines).toHaveLength(2);
    expect(model.lines.map((line) => line.method)).toEqual([
      'divisa',
      'efectivo',
    ]);
    expect(model.totalUsd).toBe(4);
  });

  it('falls back to single model when sale has no split', () => {
    const sale = createBaseSale({ paymentMethod: 'punto_venta' });

    const model = buildSalePaymentDisplayModel(sale);

    expect(model.kind).toBe('single');
    expect(model.label).toBe('Punto de Venta');
    expect(model.lines).toHaveLength(1);
    expect(model.lines[0].method).toBe('punto_venta');
  });

  it('treats invalid split as non-mixed and uses fallback', () => {
    const invalidSale = createBaseSale({
      paymentMethod: 'efectivo',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 100,
          amountUsd: 2,
          exchangeRateUsed: 50,
        },
      ],
    });

    expect(hasValidMixedPaymentSplits(invalidSale.paymentSplits)).toBe(false);

    const model = buildSalePaymentDisplayModel(invalidSale);
    expect(model.kind).toBe('single');
    expect(model.lines).toHaveLength(1);
    expect(model.lines[0].method).toBe('efectivo');
  });
});
