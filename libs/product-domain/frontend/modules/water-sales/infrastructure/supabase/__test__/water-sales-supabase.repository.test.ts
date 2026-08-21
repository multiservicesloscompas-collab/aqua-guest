import { describe, expect, it, vi } from 'vitest';

import {
  createLiterPricingSupabaseRepository,
  createSalesSupabaseRepository,
} from '../index';

describe('water sales supabase repositories', () => {
  it('replaces liter pricing rows including removed breakpoints', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'row-10', breakpoint: '10', price: '1' },
            { id: 'row-20', breakpoint: '20', price: '2' },
          ],
          error: null,
        }),
        update: vi.fn(() => ({ eq: updateEq })),
        delete: vi.fn(() => ({ eq: deleteEq })),
        insert,
      })),
    };

    const repository = createLiterPricingSupabaseRepository(supabase);

    await repository.replace([
      { breakpoint: 20, price: 2.5 },
      { breakpoint: 30, price: 3.5 },
    ]);

    expect(deleteEq).toHaveBeenCalledWith('id', 'row-10');
    expect(updateEq).toHaveBeenCalledWith('id', 'row-20');
    expect(insert).toHaveBeenCalledWith([{ breakpoint: 30, price: 3.5 }]);
  });

  it('rolls back the created sale when payment split persistence fails', async () => {
    const createdRow = {
      id: 'sale-1',
      dailyNumber: 7,
      date: '2026-03-13',
      items: [],
      paymentMethod: 'efectivo',
      totalBs: '100',
      totalUsd: '2',
      exchangeRate: '50',
      notes: null,
      createdAt: '2026-03-13T10:00:00.000Z',
      updatedAt: '2026-03-13T10:00:00.000Z',
    };
    const rollbackEq = vi.fn().mockResolvedValue({ error: null });
    const splitDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const splitError = new Error('split insert failed');
    const splitInsert = vi.fn().mockResolvedValue({ error: splitError });
    const salesInsertSelect = vi.fn().mockResolvedValue({
      data: [createdRow],
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sales') {
          return {
            select: vi.fn(),
            insert: vi.fn(() => ({ select: salesInsertSelect })),
            update: vi.fn(),
            delete: vi.fn(() => ({ eq: rollbackEq })),
          };
        }

        if (table === 'sale_payment_splits') {
          return {
            select: vi.fn(),
            delete: vi.fn(() => ({ eq: splitDeleteEq })),
            insert: splitInsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    const repository = createSalesSupabaseRepository(supabase);

    await expect(
      repository.create({
        dailyNumber: 7,
        date: '2026-03-13',
        items: [],
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        exchangeRate: 50,
        notes: undefined,
      })
    ).rejects.toBe(splitError);

    expect(splitDeleteEq).toHaveBeenCalledWith('sale_id', 'sale-1');
    expect(rollbackEq).toHaveBeenCalledWith('id', 'sale-1');
  });
});
