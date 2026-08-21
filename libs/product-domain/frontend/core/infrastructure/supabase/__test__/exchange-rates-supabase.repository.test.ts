import { describe, expect, it, vi } from 'vitest';

import { createExchangeRatesSupabaseRepository } from '../exchange-rates-supabase.repository';

describe('createExchangeRatesSupabaseRepository', () => {
  it('resolves getById against the date column', async () => {
    const eq = vi.fn();
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((column: string, value: unknown) => {
        eq(column, value);
        return query;
      }),
      neq: vi.fn(() => query),
      gt: vi.fn(() => query),
      gte: vi.fn(() => query),
      lt: vi.fn(() => query),
      lte: vi.fn(() => query),
      ilike: vi.fn(() => query),
      is: vi.fn(() => query),
      in: vi.fn(() => query),
      not: vi.fn(() => query),
      order: vi.fn(() => query),
      range: vi.fn(() => query),
      then: Promise.resolve({
        data: [
          {
            date: '2026-03-13',
            rate: '50',
            updatedAt: '2026-03-13T10:00:00.000Z',
          },
        ],
        error: null,
      }).then.bind(
        Promise.resolve({
          data: [
            {
              date: '2026-03-13',
              rate: '50',
              updatedAt: '2026-03-13T10:00:00.000Z',
            },
          ],
          error: null,
        })
      ),
    };
    const table = {
      select: vi.fn(() => query),
      insert: vi.fn(() => query),
      update: vi.fn(() => query),
      delete: vi.fn(() => query),
      upsert: vi.fn(() => query),
    };
    const supabase = {
      from: vi.fn(() => table),
    };

    const repository = createExchangeRatesSupabaseRepository(supabase);
    const result = await repository.getById('2026-03-13');

    expect(eq).toHaveBeenCalledWith('date', '2026-03-13');
    expect(result).toEqual({
      date: '2026-03-13',
      rate: 50,
      updatedAt: '2026-03-13T10:00:00.000Z',
    });
  });

  it('upserts exchange rates on the date conflict target', async () => {
    const upsert = vi.fn(() =>
      Promise.resolve({
        error: null,
      })
    );
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

    const repository = createExchangeRatesSupabaseRepository(supabase);
    await repository.upsert({
      date: '2026-03-13',
      rate: 50,
      updatedAt: '2026-03-13T10:00:00.000Z',
    });

    expect(upsert).toHaveBeenCalledWith(
      {
        date: '2026-03-13',
        rate: 50,
        updated_at: '2026-03-13T10:00:00.000Z',
      },
      { onConflict: 'date' }
    );
  });
});
