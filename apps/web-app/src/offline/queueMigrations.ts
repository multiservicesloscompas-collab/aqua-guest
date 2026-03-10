import {
  DEFAULT_SYNC_MAX_ATTEMPTS,
  SYNC_QUEUE_SCHEMA_VERSION,
  type GlobalSyncAction,
  type GlobalSyncOperation,
  type SyncErrorRecord,
} from './types';

type LegacyQueueAction = {
  id: string;
  type: GlobalSyncOperation;
  table: string;
  payload: Record<string, unknown>;
  timestamp?: number;
};

type PersistedSyncStore = {
  state?: {
    queue?: Array<LegacyQueueAction | GlobalSyncAction>;
  };
};

const asErrorRecord = (value: unknown): SyncErrorRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Partial<SyncErrorRecord>;
  if (!record.classification || !record.message || !record.occurredAt) {
    return null;
  }

  return {
    classification: record.classification,
    message: record.message,
    code: record.code,
    occurredAt: record.occurredAt,
  };
};

const migrateAction = (
  action: LegacyQueueAction | GlobalSyncAction
): GlobalSyncAction => {
  if (
    'schemaVersion' in action &&
    action.schemaVersion >= SYNC_QUEUE_SCHEMA_VERSION
  ) {
    return {
      ...action,
      retry: {
        ...action.retry,
        lastError: asErrorRecord(action.retry.lastError),
      },
    };
  }

  const now =
    ('timestamp' in action ? action.timestamp : undefined) ?? Date.now();
  const legacyPayload = action.payload ?? {};
  const idempotencySeed = `${action.table}:${action.type}:${action.id}`;

  return {
    id: action.id,
    type: action.type,
    table: action.table,
    payload: legacyPayload,
    status: 'queued',
    schemaVersion: SYNC_QUEUE_SCHEMA_VERSION,
    enqueuedAt: now,
    updatedAt: now,
    enqueueSource: 'legacy-sync-store',
    idempotency: {
      key: idempotencySeed,
      businessKey: idempotencySeed,
      payloadFingerprint: idempotencySeed,
    },
    dependencies: {
      dependsOn: [],
    },
    retry: {
      attemptCount: 0,
      maxAttempts: DEFAULT_SYNC_MAX_ATTEMPTS,
      nextAttemptAt: null,
      lastAttemptAt: null,
      lastError: null,
    },
  };
};

export const migrateSyncQueueState = (
  persisted: unknown
): PersistedSyncStore => {
  if (!persisted || typeof persisted !== 'object') {
    return { state: { queue: [] } };
  }

  const state = (persisted as PersistedSyncStore).state;
  const queue = state?.queue;

  if (!Array.isArray(queue)) {
    return {
      ...(persisted as PersistedSyncStore),
      state: {
        ...(state ?? {}),
        queue: [],
      },
    };
  }

  return {
    ...(persisted as PersistedSyncStore),
    state: {
      ...(state ?? {}),
      queue: queue.map((entry) => migrateAction(entry)),
    },
  };
};
