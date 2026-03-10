import { describe, expect, it } from 'vitest';
import { migrateSyncQueueState } from './queueMigrations';
import { SYNC_QUEUE_SCHEMA_VERSION, type GlobalSyncAction } from './types';

describe('offline/queueMigrations', () => {
  it('migrates legacy queue actions to global envelope schema', () => {
    const migrated = migrateSyncQueueState({
      state: {
        queue: [
          {
            id: 'legacy-1',
            type: 'INSERT',
            table: 'sales',
            payload: { tempId: 'temp-1', total_bs: 100 },
            timestamp: 123,
          },
        ],
      },
    });

    const queue = migrated.state?.queue ?? [];
    expect(queue).toHaveLength(1);

    const first = queue[0] as GlobalSyncAction;
    expect(first.schemaVersion).toBe(SYNC_QUEUE_SCHEMA_VERSION);
    expect(first.status).toBe('queued');
    expect(first.enqueuedAt).toBe(123);
    expect(first.retry.attemptCount).toBe(0);
    expect(first.idempotency.key).toBeDefined();
    expect(first.dependencies.dependsOn).toEqual([]);
  });
});
