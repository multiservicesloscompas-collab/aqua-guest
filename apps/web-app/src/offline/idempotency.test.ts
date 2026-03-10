import { describe, expect, it } from 'vitest';
import {
  buildPayloadFingerprint,
  buildSyncIdempotencyKey,
} from './idempotency';

describe('offline/idempotency', () => {
  it('builds stable fingerprint regardless of object key order', () => {
    const payloadA = { b: 2, a: 1, nested: { y: 2, x: 1 } };
    const payloadB = { nested: { x: 1, y: 2 }, a: 1, b: 2 };

    expect(buildPayloadFingerprint(payloadA)).toBe(
      buildPayloadFingerprint(payloadB)
    );
  });

  it('produces deterministic idempotency key for same business input', () => {
    const base = {
      table: 'sales',
      type: 'INSERT' as const,
      payload: { date: '2026-03-08', total_bs: 100 },
      businessKey: 'sale:2026-03-08:1',
    };

    const first = buildSyncIdempotencyKey(base);
    const second = buildSyncIdempotencyKey(base);

    expect(first).toEqual(second);
  });
});
