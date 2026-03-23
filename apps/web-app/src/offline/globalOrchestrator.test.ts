import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalSyncAction } from './types';
import { processGlobalOfflineQueue } from './globalOrchestrator';

const insertMock = vi.fn();
const upsertMock = vi.fn();
const insertSelectSingleMock = vi.fn();
const insertSelectMock = vi.fn(() => ({ single: insertSelectSingleMock }));
const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const deleteEqMock = vi.fn();
const deleteEqBreakpointMock = vi.fn();
const deleteEqRouterMock = vi.fn();
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn(() => ({
    insert: insertMock,
    upsert: upsertMock,
    update: updateMock,
    delete: deleteMock,
  }));

  const client = { from };
  return {
    default: client,
    supabase: client,
  };
});

const baseAction = (
  overrides: Partial<GlobalSyncAction>
): GlobalSyncAction => ({
  id: overrides.id ?? 'a1',
  type: overrides.type ?? 'INSERT',
  table: overrides.table ?? 'sales',
  payload: overrides.payload ?? { id: 'row-1', amount: 10 },
  status: overrides.status ?? 'queued',
  schemaVersion: overrides.schemaVersion ?? 2,
  enqueuedAt: overrides.enqueuedAt ?? 1,
  updatedAt: overrides.updatedAt ?? 1,
  enqueueSource: overrides.enqueueSource ?? 'test',
  idempotency: overrides.idempotency ?? {
    key: `idem-${overrides.id ?? 'a1'}`,
    businessKey: `biz-${overrides.id ?? 'a1'}`,
    payloadFingerprint: `fp-${overrides.id ?? 'a1'}`,
  },
  dependencies: overrides.dependencies ?? { dependsOn: [] },
  retry: overrides.retry ?? {
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: null,
    lastAttemptAt: null,
    lastError: null,
  },
});

describe('processGlobalOfflineQueue', () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertSelectMock.mockReset();
    insertSelectSingleMock.mockReset();
    upsertMock.mockReset();
    updateMock.mockReset();
    updateEqMock.mockReset();
    deleteMock.mockReset();
    deleteEqMock.mockReset();
    deleteEqBreakpointMock.mockReset();
    deleteEqRouterMock.mockReset();

    insertMock.mockImplementation((payload: unknown) => {
      if (Array.isArray(payload)) {
        return Promise.resolve({ error: null });
      }

      return {
        select: insertSelectMock,
      };
    });
    insertSelectSingleMock.mockResolvedValue({
      data: { id: 'inserted-id-1' },
      error: null,
    });
    upsertMock.mockResolvedValue({ error: null });
    updateEqMock.mockResolvedValue({ error: null });
    deleteEqMock.mockResolvedValue({ error: null });
    deleteEqBreakpointMock.mockResolvedValue({ error: null });

    deleteEqRouterMock.mockImplementation((column: string, value: unknown) => {
      if (column === 'breakpoint') {
        return deleteEqBreakpointMock(column, value);
      }

      if (column === 'origin_id') {
        deleteEqMock(column, value);
        return {
          eq: (nestedColumn: string, nestedValue: unknown) =>
            deleteEqMock(nestedColumn, nestedValue),
        };
      }

      return deleteEqMock(column, value);
    });
    deleteMock.mockImplementation(() => ({ eq: deleteEqRouterMock }));
  });

  it('processes queued actions and removes succeeded items', async () => {
    const queue = [
      baseAction({
        id: 'a1',
        type: 'INSERT',
        payload: { id: 'row-1', foo: 1 },
      }),
      baseAction({
        id: 'a2',
        type: 'UPDATE',
        payload: { id: 'row-2', foo: 2 },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(updateEqMock).toHaveBeenCalledTimes(1);
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results.map((entry) => entry.status)).toEqual([
      'succeeded',
      'succeeded',
    ]);
  });

  it('keeps dependent action pending when dependency not completed', async () => {
    const queue = [
      baseAction({ id: 'root-1', type: 'INSERT', status: 'failed' }),
      baseAction({
        id: 'child-1',
        type: 'INSERT',
        dependencies: { dependsOn: ['root-1'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenCalledTimes(0);
    expect(result.nextQueue).toHaveLength(2);
    expect(result.results).toHaveLength(0);
  });

  it('dedupes duplicate idempotency keys to avoid double processing', async () => {
    const duplicateKey = 'idem-dup';
    const queue = [
      baseAction({
        id: 'dup-1',
        idempotency: {
          key: duplicateKey,
          businessKey: 'biz-dup-1',
          payloadFingerprint: 'fp-dup-1',
        },
      }),
      baseAction({
        id: 'dup-2',
        enqueuedAt: 2,
        idempotency: {
          key: duplicateKey,
          businessKey: 'biz-dup-2',
          payloadFingerprint: 'fp-dup-2',
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: 'dup-2',
          status: 'skipped',
          reason: 'duplicate-idempotency-key',
        }),
      ])
    );
  });

  it('schedules retry on transient error', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: null,
      error: { status: 503, message: 'temporarily unavailable' },
    });

    const queue = [baseAction({ id: 'retry-1' })];

    const result = await processGlobalOfflineQueue({ queue });

    expect(result.nextQueue).toHaveLength(1);
    expect(result.nextQueue[0].status).toBe('retry_scheduled');
    expect(result.nextQueue[0].retry.attemptCount).toBe(1);
    expect(result.nextQueue[0].retry.nextAttemptAt).not.toBeNull();
    expect(result.results[0].status).toBe('retry_scheduled');
  });

  it('resolves split parent tempId with inserted real id', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: { id: 'sale-real-1' },
      error: null,
    });

    const queue = [
      baseAction({
        id: 'sale-root',
        table: 'sales',
        payload: {
          tempId: 'temp-sale-1',
          daily_number: 1,
          date: '2026-03-09',
          payment_method: 'efectivo',
          total_bs: 120,
          total_usd: 2.4,
          exchange_rate: 50,
          items: [],
        },
      }),
      baseAction({
        id: 'sale-split-1',
        table: 'sale_payment_splits',
        payload: {
          isSplit: true,
          parentId: 'temp-sale-1',
          splits: [
            {
              sale_id: 'temp-sale-1',
              payment_method: 'efectivo',
              amount_bs: 120,
              amount_usd: 2.4,
              exchange_rate_used: 50,
            },
          ],
        },
        dependencies: { dependsOn: ['sale-root'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          sale_id: 'sale-real-1',
        }),
      ])
    );
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results.map((entry) => entry.status)).toEqual([
      'succeeded',
      'succeeded',
    ]);
  });

  it('resolves rental split parent tempId with inserted real id', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: { id: 'rental-real-1' },
      error: null,
    });

    const queue = [
      baseAction({
        id: 'rental-root',
        table: 'washer_rentals',
        payload: {
          tempId: 'temp-rental-1',
          date: '2026-03-09',
          customer_id: 'customer-1',
          machine_id: 'machine-1',
          shift: 'medio',
          delivery_time: '09:00',
          pickup_time: '13:00',
          pickup_date: '2026-03-09',
          delivery_fee: 1,
          total_usd: 2,
          payment_method: 'efectivo',
          status: 'agendado',
          is_paid: true,
          date_paid: '2026-03-09',
        },
      }),
      baseAction({
        id: 'rental-split-1',
        table: 'rental_payment_splits',
        payload: {
          isSplit: true,
          parentId: 'temp-rental-1',
          splits: [
            {
              rental_id: 'temp-rental-1',
              payment_method: 'efectivo',
              amount_bs: 100,
              amount_usd: 2,
              exchange_rate_used: 50,
            },
          ],
        },
        dependencies: { dependsOn: ['rental-root'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          rental_id: 'rental-real-1',
        }),
      ])
    );
    expect(result.nextQueue).toHaveLength(0);
  });

  it('resolves temp id for update after create in same run', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: { id: 'prepaid-real-1' },
      error: null,
    });

    const queue = [
      baseAction({
        id: 'prepaid-create',
        table: 'prepaid_orders',
        payload: {
          tempId: 'temp-prepaid-1',
          customer_name: 'Cliente Uno',
          liters: 40,
        },
      }),
      baseAction({
        id: 'prepaid-update',
        type: 'UPDATE',
        table: 'prepaid_orders',
        payload: {
          id: 'temp-prepaid-1',
          status: 'entregado',
        },
        dependencies: { dependsOn: ['prepaid-create'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(updateEqMock).toHaveBeenCalledWith('id', 'prepaid-real-1');
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results.map((entry) => entry.status)).toEqual([
      'succeeded',
      'succeeded',
    ]);
  });

  it('uses upsert for exchange rate offline op hint', async () => {
    const queue = [
      baseAction({
        id: 'exchange-upsert',
        table: 'exchange_rates',
        payload: {
          date: '2026-03-09',
          rate: 52,
          updated_at: '2026-03-09T10:00:00.000Z',
          __op: 'upsert_on_date',
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(upsertMock).toHaveBeenCalledWith(
      {
        date: '2026-03-09',
        rate: 52,
        updated_at: '2026-03-09T10:00:00.000Z',
      },
      { onConflict: 'date' }
    );
    expect(result.nextQueue).toHaveLength(0);
  });

  it('deletes liter pricing by breakpoint with offline op hint', async () => {
    const queue = [
      baseAction({
        id: 'liter-delete',
        type: 'DELETE',
        table: 'liter_pricing',
        payload: {
          id: 'bp:19',
          breakpoint: 19,
          __op: 'delete_by_breakpoint',
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(deleteEqBreakpointMock).toHaveBeenCalledWith('breakpoint', 19);
    expect(result.nextQueue).toHaveLength(0);
  });

  it('deletes split rows by parent id with offline op hint', async () => {
    const queue = [
      baseAction({
        id: 'sale-splits-delete',
        type: 'DELETE',
        table: 'sale_payment_splits',
        payload: {
          id: 'sale_id:sale-1',
          parentId: 'sale-1',
          parentColumn: 'sale_id',
          __op: 'delete_by_parent_id',
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(deleteEqMock).toHaveBeenCalledWith('sale_id', 'sale-1');
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results[0].status).toBe('succeeded');
  });

  it('deletes scoped rows by parent id when scope metadata is present', async () => {
    const queue = [
      baseAction({
        id: 'tip-origin-delete',
        type: 'DELETE',
        table: 'tips',
        payload: {
          id: 'sale_tip:sale-1',
          parentId: 'sale-1',
          parentColumn: 'origin_id',
          parentScopeColumn: 'origin_type',
          parentScopeValue: 'sale',
          __op: 'delete_by_parent_id',
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(deleteEqMock).toHaveBeenNthCalledWith(1, 'origin_id', 'sale-1');
    expect(deleteEqMock).toHaveBeenNthCalledWith(2, 'origin_type', 'sale');
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results[0].status).toBe('succeeded');
  });

  it('does not run retry_scheduled action before nextAttemptAt', async () => {
    const queue = [
      baseAction({
        id: 'retry-future',
        status: 'retry_scheduled',
        retry: {
          attemptCount: 1,
          maxAttempts: 3,
          nextAttemptAt: Date.now() + 60_000,
          lastAttemptAt: Date.now(),
          lastError: null,
        },
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).not.toHaveBeenCalled();
    expect(result.results).toHaveLength(0);
    expect(result.nextQueue).toHaveLength(1);
    expect(result.nextQueue[0].id).toBe('retry-future');
  });

  it('keeps non-deduped independent action processing when duplicate exists', async () => {
    const duplicateKey = 'idem-dup';
    const queue = [
      baseAction({
        id: 'dup-1',
        idempotency: {
          key: duplicateKey,
          businessKey: 'biz-dup-1',
          payloadFingerprint: 'fp-dup-1',
        },
      }),
      baseAction({
        id: 'dup-2',
        enqueuedAt: 2,
        idempotency: {
          key: duplicateKey,
          businessKey: 'biz-dup-2',
          payloadFingerprint: 'fp-dup-2',
        },
      }),
      baseAction({
        id: 'independent-3',
        enqueuedAt: 3,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: 'dup-2',
          status: 'skipped',
          reason: 'duplicate-idempotency-key',
        }),
        expect.objectContaining({ actionId: 'dup-1', status: 'succeeded' }),
        expect.objectContaining({
          actionId: 'independent-3',
          status: 'succeeded',
        }),
      ])
    );
    expect(result.nextQueue).toHaveLength(0);
  });
});
