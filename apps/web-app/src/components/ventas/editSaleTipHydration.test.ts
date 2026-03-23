import { describe, expect, it } from 'vitest';
import type { Sale } from '@/types';
import type { Tip } from '@/types/tips';
import { resolveEditSaleTipHydration } from './editSaleTipHydration';

function buildSale(): Sale {
  return {
    id: 'sale-1',
    dailyNumber: 1,
    date: '2026-03-13',
    items: [],
    paymentMethod: 'pago_movil',
    totalBs: 140,
    totalUsd: 2.8,
    exchangeRate: 50,
    createdAt: '2026-03-13T10:00:00.000Z',
    updatedAt: '2026-03-13T10:00:00.000Z',
  };
}

function buildTip(amountBs: number): Tip {
  return {
    id: 'tip-1',
    originType: 'sale',
    originId: 'sale-1',
    tipDate: '2026-03-13',
    amountBs,
    capturePaymentMethod: 'efectivo',
    status: 'pending',
    notes: 'cliente frecuente',
    createdAt: '2026-03-13T10:00:00.000Z',
    updatedAt: '2026-03-13T10:00:00.000Z',
  };
}

describe('resolveEditSaleTipHydration', () => {
  it('hydrates edit values from existing linked tip', () => {
    const hydration = resolveEditSaleTipHydration(buildSale(), [buildTip(40)]);

    expect(hydration).toEqual({
      enabled: true,
      amount: '40',
      paymentMethod: 'efectivo',
      notes: 'cliente frecuente',
    });
  });

  it('returns default state when sale tip does not exist', () => {
    const hydration = resolveEditSaleTipHydration(buildSale(), []);

    expect(hydration).toEqual({
      enabled: false,
      amount: '',
      paymentMethod: 'pago_movil',
      notes: '',
    });
  });
});
