import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalSyncAction } from './types';
import { buildSupabaseMutation } from './orchestratorMutations';

const rentalsInsertMock = vi.fn();
const tipsUpsertMock = vi.fn();

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'washer_rentals') {
      return { insert: rentalsInsertMock };
    }

    if (table === 'tips') {
      return { upsert: tipsUpsertMock };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const client = { from };
  return { default: client, supabase: client };
});

const buildInsertAction = (
  payload: Record<string, unknown>
): GlobalSyncAction => ({
  id: 'action-1',
  type: 'INSERT',
  table: 'washer_rentals',
  payload,
  status: 'queued',
  schemaVersion: 2,
  enqueuedAt: 1,
  updatedAt: 1,
  enqueueSource: 'test',
  idempotency: { key: 'k', businessKey: 'rental:x', payloadFingerprint: 'f' },
  dependencies: { dependsOn: [] },
  retry: {
    attemptCount: 0,
    maxAttempts: 5,
    nextAttemptAt: null,
    lastAttemptAt: null,
    lastError: null,
  },
});

describe('buildSupabaseMutation temp id resolution', () => {
  beforeEach(() => {
    rentalsInsertMock.mockReset();
    tipsUpsertMock.mockReset();
    tipsUpsertMock.mockResolvedValue({ error: null });
    rentalsInsertMock.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({ data: { id: 'real-rental' }, error: null }),
      }),
    });
  });

  it('replaces a temp customer id in the insert payload with the real id (B12)', async () => {
    // Arrange
    const action = buildInsertAction({
      tempId: 'temp-r1',
      customer_id: 'temp-c1',
      machine_id: 'machine-1',
    });
    const tempIdToRealId = new Map([['temp-c1', 'real-customer']]);

    // Act
    const result = await buildSupabaseMutation(action, tempIdToRealId);

    // Assert
    expect(rentalsInsertMock).toHaveBeenCalledWith({
      customer_id: 'real-customer',
      machine_id: 'machine-1',
    });
    expect(result.insertedId).toBe('real-rental');
  });

  it('leaves real ids untouched', async () => {
    // Arrange
    const action = buildInsertAction({ customer_id: 'real-customer' });

    // Act
    await buildSupabaseMutation(action, new Map());

    // Assert
    expect(rentalsInsertMock).toHaveBeenCalledWith({
      customer_id: 'real-customer',
    });
  });

  it('replaces a temp rental id in a tip upsert with the real id (B13)', async () => {
    // Arrange
    const action: GlobalSyncAction = {
      ...buildInsertAction({
        origin_type: 'rental',
        origin_id: 'temp-r1',
        amount_bs: 100,
        __op: 'upsert_on_origin',
      }),
      table: 'tips',
    };
    const tempIdToRealId = new Map([['temp-r1', 'real-rental']]);

    // Act
    await buildSupabaseMutation(action, tempIdToRealId);

    // Assert
    expect(tipsUpsertMock).toHaveBeenCalledWith(
      { origin_type: 'rental', origin_id: 'real-rental', amount_bs: 100 },
      { onConflict: 'origin_type,origin_id' }
    );
  });
});
