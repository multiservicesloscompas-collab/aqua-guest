import { describe, expect, it, vi } from 'vitest';
import type { GlobalSyncAction } from './types';
import { processGlobalOfflineQueue } from './globalOrchestrator';

const insertMock = vi.fn();
const upsertMock = vi.fn();
const insertSelectSingleMock = vi.fn();
const insertSelectMock = vi.fn(() => ({ single: insertSelectSingleMock }));
const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const deleteEqMock = vi.fn();
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

describe('expense payment split offline sync mapping', () => {
  it('resolves expense split parent tempId with inserted real id', async () => {
    insertMock.mockReset();
    upsertMock.mockReset();
    updateEqMock.mockReset();
    deleteEqMock.mockReset();
    insertSelectMock.mockReset();
    insertSelectSingleMock.mockReset();

    insertMock.mockImplementation((payload: unknown) => {
      if (Array.isArray(payload)) {
        return Promise.resolve({ error: null });
      }

      return {
        select: insertSelectMock,
      };
    });

    insertSelectSingleMock.mockResolvedValue({
      data: { id: 'expense-real-1' },
      error: null,
    });

    const queue = [
      baseAction({
        id: 'expense-root',
        table: 'expenses',
        payload: {
          tempId: 'temp-expense-1',
          date: '2026-03-09',
          description: 'Compra insumos',
          amount: 120,
          category: 'insumos',
          payment_method: 'pago_movil',
        },
      }),
      baseAction({
        id: 'expense-split-1',
        table: 'expense_payment_splits',
        payload: {
          isSplit: true,
          parentId: 'temp-expense-1',
          splits: [
            {
              expense_id: 'temp-expense-1',
              payment_method: 'efectivo',
              amount_bs: 20,
              amount_usd: 0.4,
              exchange_rate_used: 50,
            },
            {
              expense_id: 'temp-expense-1',
              payment_method: 'pago_movil',
              amount_bs: 100,
              amount_usd: 2,
              exchange_rate_used: 50,
            },
          ],
        },
        dependencies: { dependsOn: ['expense-root'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(insertMock).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({ expense_id: 'expense-real-1' }),
      ])
    );
    expect(result.nextQueue).toHaveLength(0);
    expect(result.results.map((entry) => entry.status)).toEqual([
      'succeeded',
      'succeeded',
    ]);
  });

  it('schedules retry when expense split insertion fails', async () => {
    insertMock.mockReset();
    upsertMock.mockReset();
    updateEqMock.mockReset();
    deleteEqMock.mockReset();
    insertSelectMock.mockReset();
    insertSelectSingleMock.mockReset();

    insertMock.mockImplementation((payload: unknown) => {
      if (Array.isArray(payload)) {
        return Promise.resolve({
          error: { status: 503, message: 'split table unavailable' },
        });
      }

      return {
        select: insertSelectMock,
      };
    });

    insertSelectSingleMock.mockResolvedValue({
      data: { id: 'expense-real-1' },
      error: null,
    });

    const queue = [
      baseAction({
        id: 'expense-root',
        table: 'expenses',
        payload: {
          tempId: 'temp-expense-1',
          date: '2026-03-09',
          description: 'Compra insumos',
          amount: 120,
          category: 'insumos',
          payment_method: 'pago_movil',
        },
      }),
      baseAction({
        id: 'expense-split-1',
        table: 'expense_payment_splits',
        payload: {
          isSplit: true,
          parentId: 'temp-expense-1',
          splits: [
            {
              expense_id: 'temp-expense-1',
              payment_method: 'pago_movil',
              amount_bs: 120,
              amount_usd: 2.4,
              exchange_rate_used: 50,
            },
          ],
        },
        dependencies: { dependsOn: ['expense-root'] },
        enqueuedAt: 2,
      }),
    ];

    const result = await processGlobalOfflineQueue({ queue });

    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: 'expense-root',
          status: 'succeeded',
        }),
        expect.objectContaining({
          actionId: 'expense-split-1',
          status: 'retry_scheduled',
        }),
      ])
    );
    expect(result.nextQueue).toHaveLength(1);
    expect(result.nextQueue[0].id).toBe('expense-split-1');
    expect(result.nextQueue[0].status).toBe('retry_scheduled');
  });
});
