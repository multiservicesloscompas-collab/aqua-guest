import { describe, expect, it, vi } from 'vitest';

import { createTipsSupabaseRepository } from '../tips-supabase.repository';

describe('createTipsSupabaseRepository', () => {
  it('upserts tips by origin and returns the mapped entity', async () => {
    const select = vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'tip-1',
            originType: 'sale',
            originId: 'sale-1',
            tipDate: '2026-03-13',
            amountBs: '15',
            amountUsd: '0.3',
            exchangeRateUsed: '50',
            capturePaymentMethod: 'pago_movil',
            status: 'pending',
            paidPaymentMethod: null,
            paidAt: null,
            notes: 'mesa 3',
            createdAt: '2026-03-13T10:00:00.000Z',
            updatedAt: '2026-03-13T10:00:00.000Z',
          },
        ],
        error: null,
      })
    );
    const upsert = vi.fn(() => ({ select }));
    const table = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert,
    };
    const supabase = {
      from: vi.fn(() => table),
    };

    const repository = createTipsSupabaseRepository(supabase);
    const tip = await repository.upsertByOrigin({
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: 15,
      amountUsd: 0.3,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      notes: 'mesa 3',
    });

    expect(upsert).toHaveBeenCalledWith(
      {
        origin_type: 'sale',
        origin_id: 'sale-1',
        tip_date: '2026-03-13',
        amount_bs: 15,
        amount_usd: 0.3,
        exchange_rate_used: 50,
        capture_payment_method: 'pago_movil',
        notes: 'mesa 3',
      },
      { onConflict: 'origin_type,origin_id' }
    );
    expect(tip.id).toBe('tip-1');
    expect(tip.amountBs).toBe(15);
  });

  it('summarizes payForDay from updated tip rows', async () => {
    const select = vi.fn(() =>
      Promise.resolve({
        data: [
          { tipDate: '2026-03-13', amountBs: '50' },
          { tipDate: '2026-03-13', amountBs: '30' },
        ],
        error: null,
      })
    );
    const eqStatus = vi.fn(() => ({ select }));
    const eqTipDate = vi.fn(() => ({ eq: eqStatus }));
    const update = vi.fn(() => ({ eq: eqTipDate }));
    const table = {
      select: vi.fn(),
      insert: vi.fn(),
      update,
      delete: vi.fn(),
      upsert: vi.fn(),
    };
    const supabase = {
      from: vi.fn(() => table),
    };

    const repository = createTipsSupabaseRepository(supabase);
    const result = await repository.payForDay({
      tipDate: '2026-03-13',
      paymentMethod: 'efectivo',
      idempotencyKey: 'tips:2026-03-13:efectivo',
      paidAt: '2026-03-13T18:00:00.000Z',
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(eqTipDate).toHaveBeenCalledWith('tip_date', '2026-03-13');
    expect(eqStatus).toHaveBeenCalledWith('status', 'pending');
    expect(result).toEqual({
      date: '2026-03-13',
      paymentMethod: 'efectivo',
      paidCount: 2,
      totalAmountBs: 80,
    });
  });
});
