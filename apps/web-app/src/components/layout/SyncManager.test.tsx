import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncManager } from './SyncManager';
import { useSyncStore } from '@/store/useSyncStore';

const processGlobalOfflineQueueMock = vi.fn();
const getOfflineFeatureFlagsMock = vi.fn();
const resolveOfflineSyncProcessorModeMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
const companiesSelectMock = vi.fn();
const userProfilesSelectMock = vi.fn();

let onlineState = true;

vi.mock('@/hooks/useNetworkState', () => ({
  useNetworkState: () => onlineState,
}));

vi.mock('@/offline/globalOrchestrator', () => ({
  processGlobalOfflineQueue: (...args: unknown[]) =>
    processGlobalOfflineQueueMock(...args),
}));

vi.mock('@/offline/featureFlags', () => ({
  getOfflineFeatureFlags: () => getOfflineFeatureFlagsMock(),
  resolveOfflineSyncProcessorMode: (...args: unknown[]) =>
    resolveOfflineSyncProcessorModeMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'companies') {
      return { select: companiesSelectMock };
    }

    if (table === 'user_profiles') {
      return { select: userProfilesSelectMock };
    }

    return { select: vi.fn() };
  });

  const client = { from };
  return {
    default: client,
    supabase: client,
  };
});

const addQueuedAction = (id: string) => {
  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'sales',
    payload: { id, amount: 10 },
    enqueueSource: 'sync-manager-test',
    businessKey: id,
  });
};

describe('SyncManager', () => {
  beforeEach(() => {
    onlineState = true;
    useSyncStore.getState().clearQueue();

    processGlobalOfflineQueueMock.mockReset();
    getOfflineFeatureFlagsMock.mockReset();
    resolveOfflineSyncProcessorModeMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    companiesSelectMock.mockReset();
    userProfilesSelectMock.mockReset();

    companiesSelectMock.mockResolvedValue({ data: [], error: null });
    userProfilesSelectMock.mockResolvedValue({ data: [], error: null });

    getOfflineFeatureFlagsMock.mockReturnValue({
      GLOBAL_OFFLINE_ORCHESTRATOR: true,
      LEGACY_SYNC_MANAGER_DISABLED: false,
      OFFLINE_QUEUE_PROCESSING_ENABLED: true,
    });
    resolveOfflineSyncProcessorModeMock.mockReturnValue('global');
  });

  it('processes queue in global mode and reports dead-letter queue actions', async () => {
    addQueuedAction('sale-1');

    processGlobalOfflineQueueMock.mockResolvedValue({
      results: [{ actionId: 'a1', status: 'failed' }],
      nextQueue: [
        {
          ...useSyncStore.getState().queue[0],
          status: 'failed',
        },
      ],
    });

    render(<SyncManager />);

    await waitFor(() => {
      expect(processGlobalOfflineQueueMock).toHaveBeenCalledTimes(1);
    });

    expect(toastErrorMock).toHaveBeenCalledWith(
      'Sincronización parcial: 1 acción(es) fallaron y quedaron en cola.'
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Se detectaron 1 acción(es) en dead-letter queue.'
    );
  });

  it('does not process queue while offline', async () => {
    onlineState = false;
    addQueuedAction('sale-2');

    render(<SyncManager />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(processGlobalOfflineQueueMock).not.toHaveBeenCalled();
  });

  it('shows success toast when global sync drains queue', async () => {
    addQueuedAction('sale-3');

    processGlobalOfflineQueueMock.mockResolvedValue({
      results: [{ actionId: 'a1', status: 'succeeded' }],
      nextQueue: [],
    });

    render(<SyncManager />);

    await waitFor(() => {
      expect(processGlobalOfflineQueueMock).toHaveBeenCalledTimes(1);
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Sincronización completada con éxito.'
    );
    expect(toastErrorMock).not.toHaveBeenCalledWith(
      expect.stringContaining('dead-letter queue')
    );
  });

  it('does not process queue when processor mode resolves to disabled', async () => {
    addQueuedAction('sale-4');
    resolveOfflineSyncProcessorModeMock.mockReturnValue('disabled');

    render(<SyncManager />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(processGlobalOfflineQueueMock).not.toHaveBeenCalled();
  });

  it('refreshes companies and user profiles on reconnect', async () => {
    onlineState = false;

    const { rerender } = render(<SyncManager />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(companiesSelectMock).not.toHaveBeenCalled();
    expect(userProfilesSelectMock).not.toHaveBeenCalled();

    onlineState = true;
    rerender(<SyncManager />);

    await waitFor(() => {
      expect(companiesSelectMock).toHaveBeenCalledWith('*');
    });

    expect(userProfilesSelectMock).toHaveBeenCalledWith('*');
  });
});
