export const DEFAULT_SYNC_MAX_ATTEMPTS = 5;
export const SYNC_QUEUE_SCHEMA_VERSION = 2;

export type GlobalSyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export type SyncLifecycleStatus =
  | 'queued'
  | 'processing'
  | 'retry_scheduled'
  | 'succeeded'
  | 'failed';

export enum SyncErrorClassification {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  CONFLICT = 'conflict',
  UNKNOWN = 'unknown',
}

export interface SyncErrorRecord {
  classification: SyncErrorClassification;
  message: string;
  code?: string | number;
  occurredAt: number;
}

export interface SyncRetryMetadata {
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: number | null;
  lastAttemptAt: number | null;
  lastError: SyncErrorRecord | null;
}

export interface SyncIdempotencyMetadata {
  key: string;
  businessKey: string;
  payloadFingerprint: string;
}

export interface SyncDependencyMetadata {
  dependsOn: string[];
  group?: string;
}

export interface GlobalSyncAction {
  id: string;
  type: GlobalSyncOperation;
  table: string;
  payload: Record<string, unknown>;
  status: SyncLifecycleStatus;
  schemaVersion: number;
  enqueuedAt: number;
  updatedAt: number;
  enqueueSource: string;
  idempotency: SyncIdempotencyMetadata;
  dependencies: SyncDependencyMetadata;
  retry: SyncRetryMetadata;
}

export interface SyncEnqueueInput {
  type: GlobalSyncOperation;
  table: string;
  payload: Record<string, unknown>;
  enqueueSource?: string;
  businessKey?: string;
  dependencyKeys?: string[];
  maxAttempts?: number;
}
