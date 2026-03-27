import {
  SyncErrorClassification,
  type GlobalSyncAction,
  type SyncLifecycleStatus,
} from './types';
import {
  buildRetryErrorRecord,
  classifySyncError,
  computeNextAttemptAt,
  shouldRetry,
} from './retryPolicy';
import {
  buildSupabaseMutation,
  dedupeByIdempotencyKey,
} from './orchestratorMutations';

export interface GlobalSyncProcessorInput {
  queue: GlobalSyncAction[];
  inFlightActionIds?: Set<string>;
}

export interface GlobalSyncProcessResult {
  actionId: string;
  status: 'succeeded' | 'retry_scheduled' | 'failed' | 'skipped';
  action?: GlobalSyncAction;
  reason?: string;
}

export interface GlobalSyncProcessorOutput {
  results: GlobalSyncProcessResult[];
  nextQueue: GlobalSyncAction[];
}

const isActionReady = (
  action: GlobalSyncAction,
  completedIds: Set<string>,
  inFlightActionIds: Set<string>
): boolean => {
  if (inFlightActionIds.has(action.id)) {
    return false;
  }

  if (action.status === 'failed' || action.status === 'succeeded') {
    return false;
  }

  if (
    action.retry.nextAttemptAt !== null &&
    action.retry.nextAttemptAt > Date.now() &&
    action.status === 'retry_scheduled'
  ) {
    return false;
  }

  return action.dependencies.dependsOn.every((dep) => completedIds.has(dep));
};

type RetryOrFailedStatus = Extract<
  SyncLifecycleStatus,
  'retry_scheduled' | 'failed'
>;
type RetryOrFailedAction = GlobalSyncAction & { status: RetryOrFailedStatus };

const markForRetryOrFailure = (
  action: GlobalSyncAction,
  error: unknown,
  now: number
): RetryOrFailedAction => {
  const classification = classifySyncError(error);
  const retryError = buildRetryErrorRecord(error, classification);
  const nextAttemptCount = action.retry.attemptCount + 1;
  const retryable = shouldRetry(
    {
      ...action,
      retry: {
        ...action.retry,
        attemptCount: nextAttemptCount,
      },
    },
    classification
  );

  if (!retryable || classification === SyncErrorClassification.PERMANENT) {
    return {
      ...action,
      status: 'failed',
      updatedAt: now,
      retry: {
        ...action.retry,
        attemptCount: nextAttemptCount,
        lastAttemptAt: now,
        nextAttemptAt: null,
        lastError: retryError,
      },
    };
  }

  return {
    ...action,
    status: 'retry_scheduled',
    updatedAt: now,
    retry: {
      ...action.retry,
      attemptCount: nextAttemptCount,
      lastAttemptAt: now,
      nextAttemptAt: computeNextAttemptAt(nextAttemptCount),
      lastError: retryError,
    },
  };
};

export const processGlobalOfflineQueue = async ({
  queue,
  inFlightActionIds = new Set<string>(),
}: GlobalSyncProcessorInput): Promise<GlobalSyncProcessorOutput> => {
  if (queue.length === 0) {
    return { results: [], nextQueue: [] };
  }

  const ordered = [...queue].sort((a, b) => a.enqueuedAt - b.enqueuedAt);
  const deduped = dedupeByIdempotencyKey(ordered);
  const results: GlobalSyncProcessResult[] = [...deduped.skipped];
  const completedIds = new Set<string>();
  const nextQueue: GlobalSyncAction[] = [];
  const tempIdToRealId = new Map<string, string>();

  for (const action of deduped.queue) {
    if (!isActionReady(action, completedIds, inFlightActionIds)) {
      nextQueue.push(action);
      continue;
    }

    const now = Date.now();
    const processingAction: GlobalSyncAction = {
      ...action,
      status: 'processing',
      updatedAt: now,
      retry: {
        ...action.retry,
        lastAttemptAt: now,
      },
    };

    try {
      const response = await buildSupabaseMutation(
        processingAction,
        tempIdToRealId
      );
      if (response.error) {
        const errored = markForRetryOrFailure(
          processingAction,
          response.error,
          now
        );
        results.push({
          actionId: action.id,
          status: errored.status,
          action: errored,
        });
        nextQueue.push(errored);
        continue;
      }

      completedIds.add(action.id);
      if (
        action.type === 'INSERT' &&
        typeof action.payload.tempId === 'string' &&
        response.insertedId
      ) {
        tempIdToRealId.set(action.payload.tempId, response.insertedId);
      }
      results.push({
        actionId: action.id,
        status: 'succeeded',
      });
    } catch (error) {
      const errored = markForRetryOrFailure(processingAction, error, now);
      results.push({
        actionId: action.id,
        status: errored.status,
        action: errored,
      });
      nextQueue.push(errored);
    }
  }

  return {
    results,
    nextQueue,
  };
};
