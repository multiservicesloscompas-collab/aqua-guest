import { describe, expect, it } from 'vitest';
import {
  resolveOfflineSyncProcessorMode,
  type OfflineFeatureFlags,
} from './featureFlags';

const flags = (
  overrides: Partial<OfflineFeatureFlags> = {}
): OfflineFeatureFlags => ({
  GLOBAL_OFFLINE_ORCHESTRATOR: false,
  LEGACY_SYNC_MANAGER_DISABLED: false,
  OFFLINE_QUEUE_PROCESSING_ENABLED: true,
  ...overrides,
});

describe('resolveOfflineSyncProcessorMode', () => {
  it('routes to global processor when orchestrator flag is enabled', () => {
    expect(
      resolveOfflineSyncProcessorMode(
        flags({
          GLOBAL_OFFLINE_ORCHESTRATOR: true,
          LEGACY_SYNC_MANAGER_DISABLED: false,
        })
      )
    ).toBe('global');
  });

  it('routes to legacy processor on backward-safe defaults', () => {
    expect(resolveOfflineSyncProcessorMode(flags())).toBe('legacy');
  });

  it('disables all processing when kill switch is off', () => {
    expect(
      resolveOfflineSyncProcessorMode(
        flags({ OFFLINE_QUEUE_PROCESSING_ENABLED: false })
      )
    ).toBe('disabled');
  });

  it('disables legacy when orchestrator is off and legacy is explicitly disabled', () => {
    expect(
      resolveOfflineSyncProcessorMode(
        flags({
          GLOBAL_OFFLINE_ORCHESTRATOR: false,
          LEGACY_SYNC_MANAGER_DISABLED: true,
        })
      )
    ).toBe('disabled');
  });
});
