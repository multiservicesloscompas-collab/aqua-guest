import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SYNC_MAX_ATTEMPTS,
  SYNC_QUEUE_SCHEMA_VERSION,
  type GlobalSyncAction,
  type SyncEnqueueInput,
} from '@/offline/types';
import { buildSyncIdempotencyKey } from '@/offline/idempotency';
import { migrateSyncQueueState } from '@/offline/queueMigrations';

const generateActionId = () => Math.random().toString(36).substring(2, 15);

interface SyncState {
  queue: GlobalSyncAction[];
  addToQueue: (action: SyncEnqueueInput) => void;
  replaceQueue: (queue: GlobalSyncAction[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      queue: [],
      addToQueue: (action) =>
        set((state) => {
          const now = Date.now();
          const idempotency = buildSyncIdempotencyKey(action);
          const queueAction: GlobalSyncAction = {
            id: generateActionId(),
            type: action.type,
            table: action.table,
            payload: action.payload,
            status: 'queued',
            schemaVersion: SYNC_QUEUE_SCHEMA_VERSION,
            enqueuedAt: now,
            updatedAt: now,
            enqueueSource: action.enqueueSource ?? 'unknown',
            idempotency,
            dependencies: {
              dependsOn: action.dependencyKeys ?? [],
            },
            retry: {
              attemptCount: 0,
              maxAttempts: action.maxAttempts ?? DEFAULT_SYNC_MAX_ATTEMPTS,
              nextAttemptAt: null,
              lastAttemptAt: null,
              lastError: null,
            },
          };

          return {
            queue: [...state.queue, queueAction],
          };
        }),
      replaceQueue: (queue) =>
        set(() => ({
          queue,
        })),
      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== id),
        })),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'aquagest-sync-queue',
      version: SYNC_QUEUE_SCHEMA_VERSION,
      migrate: (persistedState) => migrateSyncQueueState(persistedState),
    }
  )
);
