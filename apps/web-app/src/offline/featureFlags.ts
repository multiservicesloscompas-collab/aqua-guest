export interface OfflineFeatureFlags {
  GLOBAL_OFFLINE_ORCHESTRATOR: boolean;
  LEGACY_SYNC_MANAGER_DISABLED: boolean;
  OFFLINE_QUEUE_PROCESSING_ENABLED: boolean;
}

export type OfflineSyncProcessorMode = 'global' | 'legacy' | 'disabled';

const readBooleanFromStorage = (key: string, fallback: boolean): boolean => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (value === null) {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true';
};

export const getOfflineFeatureFlags = (): OfflineFeatureFlags => ({
  GLOBAL_OFFLINE_ORCHESTRATOR: readBooleanFromStorage(
    'offline.flag.global_orchestrator',
    false
  ),
  LEGACY_SYNC_MANAGER_DISABLED: readBooleanFromStorage(
    'offline.flag.legacy_sync_manager_disabled',
    false
  ),
  OFFLINE_QUEUE_PROCESSING_ENABLED: readBooleanFromStorage(
    'offline.flag.queue_processing_enabled',
    true
  ),
});

export const resolveOfflineSyncProcessorMode = (
  flags: OfflineFeatureFlags
): OfflineSyncProcessorMode => {
  if (!flags.OFFLINE_QUEUE_PROCESSING_ENABLED) {
    return 'disabled';
  }

  if (flags.GLOBAL_OFFLINE_ORCHESTRATOR) {
    return 'global';
  }

  if (flags.LEGACY_SYNC_MANAGER_DISABLED) {
    return 'disabled';
  }

  return 'legacy';
};
