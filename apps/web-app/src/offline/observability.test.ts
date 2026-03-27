import { describe, expect, it } from 'vitest';
import type { GlobalSyncAction } from './types';
import {
  buildQueueObservabilitySnapshot,
  summarizeProcessResults,
} from './observability';

const baseAction = (
  overrides: Partial<GlobalSyncAction>
): GlobalSyncAction => ({
  id: overrides.id ?? 'a1',
  type: overrides.type ?? 'INSERT',
  table: overrides.table ?? 'sales',
  payload: overrides.payload ?? { id: 'row-1' },
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

describe('offline/observability', () => {
  it('builds status, retry, dependency, and dead-letter counters', () => {
    const now = 2_000;
    const queue: GlobalSyncAction[] = [
      baseAction({ id: 'queued-ready', status: 'queued' }),
      baseAction({
        id: 'retry-due',
        status: 'retry_scheduled',
        retry: {
          attemptCount: 1,
          maxAttempts: 3,
          nextAttemptAt: 1_999,
          lastAttemptAt: 1_000,
          lastError: null,
        },
      }),
      baseAction({
        id: 'retry-future',
        status: 'retry_scheduled',
        retry: {
          attemptCount: 1,
          maxAttempts: 3,
          nextAttemptAt: 2_500,
          lastAttemptAt: 1_500,
          lastError: null,
        },
      }),
      baseAction({ id: 'failed-1', status: 'failed' }),
      baseAction({
        id: 'child-blocked',
        status: 'queued',
        dependencies: { dependsOn: ['failed-1'] },
      }),
    ];

    const snapshot = buildQueueObservabilitySnapshot(queue, now);

    expect(snapshot.total).toBe(5);
    expect(snapshot.deadLetterCount).toBe(1);
    expect(snapshot.dueRetryCount).toBe(1);
    expect(snapshot.blockedByDependencyCount).toBe(1);
    expect(snapshot.readyCount).toBe(2);
    expect(snapshot.byStatus).toEqual({
      queued: 2,
      processing: 0,
      retry_scheduled: 2,
      succeeded: 0,
      failed: 1,
    });
  });

  it('summarizes process results by status', () => {
    const summary = summarizeProcessResults([
      { actionId: 'a1', status: 'succeeded' },
      { actionId: 'a2', status: 'succeeded' },
      { actionId: 'a3', status: 'retry_scheduled' },
      { actionId: 'a4', status: 'failed' },
      {
        actionId: 'a5',
        status: 'skipped',
        reason: 'duplicate-idempotency-key',
      },
    ]);

    expect(summary).toEqual({
      succeeded: 2,
      retry_scheduled: 1,
      failed: 1,
      skipped: 1,
    });
  });
});
