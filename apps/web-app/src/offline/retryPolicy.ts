import {
  SyncErrorClassification,
  type GlobalSyncAction,
  type SyncErrorRecord,
} from './types';

const TRANSIENT_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'NETWORK_ERROR']);

export const classifySyncError = (error: unknown): SyncErrorClassification => {
  if (!error || typeof error !== 'object') {
    return SyncErrorClassification.UNKNOWN;
  }

  const maybeError = error as { code?: string | number; status?: number };

  if (maybeError.status === 409) {
    return SyncErrorClassification.CONFLICT;
  }

  if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
    return SyncErrorClassification.TRANSIENT;
  }

  if (
    typeof maybeError.code === 'string' &&
    TRANSIENT_CODES.has(maybeError.code.toUpperCase())
  ) {
    return SyncErrorClassification.TRANSIENT;
  }

  if (typeof maybeError.status === 'number' && maybeError.status >= 400) {
    return SyncErrorClassification.PERMANENT;
  }

  return SyncErrorClassification.UNKNOWN;
};

export const buildRetryErrorRecord = (
  error: unknown,
  classification = classifySyncError(error)
): SyncErrorRecord => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unknown sync error';

  const code =
    error && typeof error === 'object' && 'code' in error
      ? (error as { code?: string | number }).code
      : undefined;

  return {
    classification,
    message,
    code,
    occurredAt: Date.now(),
  };
};

export const shouldRetry = (
  action: GlobalSyncAction,
  classification: SyncErrorClassification
): boolean => {
  if (classification === SyncErrorClassification.PERMANENT) {
    return false;
  }

  return action.retry.attemptCount < action.retry.maxAttempts;
};

export const computeNextAttemptAt = (
  attemptCount: number,
  baseMs = 1_000,
  maxMs = 60_000
): number => {
  const exponent = Math.max(0, attemptCount - 1);
  const capped = Math.min(maxMs, baseMs * 2 ** exponent);
  return Date.now() + capped;
};
