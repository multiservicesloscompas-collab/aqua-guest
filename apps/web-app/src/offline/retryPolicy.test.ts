import { describe, expect, it } from 'vitest';
import { computeNextAttemptAt, shouldRetry } from './retryPolicy';
import {
  DEFAULT_SYNC_MAX_ATTEMPTS,
  SyncErrorClassification,
  type GlobalSyncAction,
} from './types';

const createAction = (attemptCount: number): GlobalSyncAction => ({
  id: 'a1',
  type: 'INSERT',
  table: 'sales',
  payload: {},
  status: 'queued',
  schemaVersion: 2,
  enqueuedAt: 1,
  updatedAt: 1,
  enqueueSource: 'test',
  idempotency: {
    key: 'k',
    businessKey: 'b',
    payloadFingerprint: 'p',
  },
  dependencies: {
    dependsOn: [],
  },
  retry: {
    attemptCount,
    maxAttempts: DEFAULT_SYNC_MAX_ATTEMPTS,
    nextAttemptAt: null,
    lastAttemptAt: null,
    lastError: null,
  },
});

describe('offline/retryPolicy', () => {
  it('does not retry permanent errors', () => {
    expect(
      shouldRetry(createAction(0), SyncErrorClassification.PERMANENT)
    ).toBe(false);
  });

  it('retries transient errors under max attempts', () => {
    expect(
      shouldRetry(createAction(1), SyncErrorClassification.TRANSIENT)
    ).toBe(true);
  });

  it('stops retrying after max attempts', () => {
    expect(
      shouldRetry(
        createAction(DEFAULT_SYNC_MAX_ATTEMPTS),
        SyncErrorClassification.TRANSIENT
      )
    ).toBe(false);
  });

  it('computes exponential backoff bounded by max', () => {
    const now = Date.now();
    const next = computeNextAttemptAt(3, 1_000, 60_000);

    expect(next).toBeGreaterThanOrEqual(now + 4_000);
    expect(next).toBeLessThanOrEqual(now + 4_500);
  });
});
