import type { SyncEnqueueInput } from './types';

const stringifyStable = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyStable(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${stringifyStable(record[key])}`)
    .join(',');

  return `{${body}}`;
};

const hashDjb2 = (input: string): string => {
  let hash = 5381;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }

  return (hash >>> 0).toString(16);
};

export const buildPayloadFingerprint = (payload: Record<string, unknown>) =>
  hashDjb2(stringifyStable(payload));

export const buildSyncIdempotencyKey = (
  input: Pick<SyncEnqueueInput, 'table' | 'type' | 'payload' | 'businessKey'>
): { key: string; payloadFingerprint: string; businessKey: string } => {
  const payloadFingerprint = buildPayloadFingerprint(input.payload);
  const businessKey =
    input.businessKey ?? `${input.table}:${payloadFingerprint}`;
  const keySource = `${input.table}|${input.type}|${businessKey}|${payloadFingerprint}`;

  return {
    key: hashDjb2(keySource),
    payloadFingerprint,
    businessKey,
  };
};
