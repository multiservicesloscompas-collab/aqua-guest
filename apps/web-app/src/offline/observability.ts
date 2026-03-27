import type { GlobalSyncAction, SyncLifecycleStatus } from './types';
import type { GlobalSyncProcessResult } from './globalOrchestrator';

export interface QueueStatusCounts {
  queued: number;
  processing: number;
  retry_scheduled: number;
  succeeded: number;
  failed: number;
}

export interface QueueObservabilitySnapshot {
  total: number;
  deadLetterCount: number;
  dueRetryCount: number;
  blockedByDependencyCount: number;
  readyCount: number;
  byStatus: QueueStatusCounts;
}

export interface ProcessResultSummary {
  succeeded: number;
  retry_scheduled: number;
  failed: number;
  skipped: number;
}

const EMPTY_STATUS_COUNTS: QueueStatusCounts = {
  queued: 0,
  processing: 0,
  retry_scheduled: 0,
  succeeded: 0,
  failed: 0,
};

const isDependencyBlocked = (
  action: GlobalSyncAction,
  queueById: Map<string, GlobalSyncAction>
): boolean =>
  action.dependencies.dependsOn.some((dependencyId) => {
    const dependency = queueById.get(dependencyId);
    if (!dependency) {
      return false;
    }

    return dependency.status !== 'succeeded';
  });

const isRetryDue = (action: GlobalSyncAction, now: number): boolean =>
  action.status === 'retry_scheduled' &&
  action.retry.nextAttemptAt !== null &&
  action.retry.nextAttemptAt <= now;

const isReady = (
  action: GlobalSyncAction,
  queueById: Map<string, GlobalSyncAction>,
  now: number
): boolean => {
  if (action.status === 'failed' || action.status === 'succeeded') {
    return false;
  }

  if (
    action.status === 'retry_scheduled' &&
    action.retry.nextAttemptAt !== null &&
    action.retry.nextAttemptAt > now
  ) {
    return false;
  }

  return !isDependencyBlocked(action, queueById);
};

export const buildQueueObservabilitySnapshot = (
  queue: GlobalSyncAction[],
  now = Date.now()
): QueueObservabilitySnapshot => {
  const queueById = new Map(queue.map((action) => [action.id, action]));
  const byStatus: QueueStatusCounts = { ...EMPTY_STATUS_COUNTS };

  let deadLetterCount = 0;
  let dueRetryCount = 0;
  let blockedByDependencyCount = 0;
  let readyCount = 0;

  for (const action of queue) {
    byStatus[action.status as SyncLifecycleStatus] += 1;

    if (action.status === 'failed') {
      deadLetterCount += 1;
    }

    if (isRetryDue(action, now)) {
      dueRetryCount += 1;
    }

    if (isDependencyBlocked(action, queueById)) {
      blockedByDependencyCount += 1;
    }

    if (isReady(action, queueById, now)) {
      readyCount += 1;
    }
  }

  return {
    total: queue.length,
    deadLetterCount,
    dueRetryCount,
    blockedByDependencyCount,
    readyCount,
    byStatus,
  };
};

export const summarizeProcessResults = (
  results: GlobalSyncProcessResult[]
): ProcessResultSummary =>
  results.reduce<ProcessResultSummary>(
    (summary, entry) => {
      summary[entry.status] += 1;
      return summary;
    },
    {
      succeeded: 0,
      retry_scheduled: 0,
      failed: 0,
      skipped: 0,
    }
  );
