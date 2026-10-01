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
const buildSupabaseMutationMock = vi.fn();
const salesInsertMock = vi.fn();
const saleSplitsInsertMock = vi.fn();

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

vi.mock('@/offline/orchestratorMutations', () => ({
  buildSupabaseMutation: (...args: unknown[]) =>
    buildSupabaseMutationMock(...args),
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

    if (table === 'sales') {
      return { insert: salesInsertMock };
    }

    if (table === 'sale_payment_splits') {
      return { insert: saleSplitsInsertMock };
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
    buildSupabaseMutationMock.mockReset();
    salesInsertMock.mockReset();
    saleSplitsInsertMock.mockReset();

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

describe('SyncManager legacy processor', () => {
  const enqueue = (
    table: string,
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, unknown>,
    businessKey: string,
    dependencyKeys?: string[]
  ) =>
    useSyncStore.getState().addToQueue({
      type,
      table,
      payload,
      enqueueSource: 'sync-manager-legacy-test',
      businessKey,
      dependencyKeys,
    });

  beforeEach(() => {
    onlineState = true;
    useSyncStore.getState().clearQueue();
    buildSupabaseMutationMock.mockReset();
    salesInsertMock.mockReset();
    saleSplitsInsertMock.mockReset();
    companiesSelectMock.mockReset();
    userProfilesSelectMock.mockReset();
    companiesSelectMock.mockResolvedValue({ data: [], error: null });
    userProfilesSelectMock.mockResolvedValue({ data: [], error: null });
    getOfflineFeatureFlagsMock.mockReturnValue({});
    resolveOfflineSyncProcessorModeMock.mockReturnValue('legacy');
  });

  it('replays an expense and its splits resolving the temp id (B14)', async () => {
    // Arrange
    buildSupabaseMutationMock.mockResolvedValue({
      error: null,
      insertedId: 'real-expense',
    });
    enqueue('expenses', 'INSERT', { tempId: 'temp-e1' }, 'expense:temp-e1');
    enqueue(
      'expense_payment_splits',
      'INSERT',
      { isSplit: true, parentId: 'temp-e1', splits: [] },
      'expense-splits:temp-e1',
      ['expense:temp-e1']
    );

    // Act
    render(<SyncManager />);

    // Assert
    await waitFor(() => {
      expect(useSyncStore.getState().queue).toHaveLength(0);
    });
    expect(buildSupabaseMutationMock).toHaveBeenCalledTimes(2);
    const sharedMap = buildSupabaseMutationMock.mock.calls[1][1] as Map<
      string,
      string
    >;
    expect(sharedMap.get('temp-e1')).toBe('real-expense');
  });

  it('replays an UPDATE of an existing sale (B14)', async () => {
    // Arrange
    buildSupabaseMutationMock.mockResolvedValue({ error: null });
    enqueue('sales', 'UPDATE', { id: 'sale-1', total_bs: 1500 }, 'sale:sale-1');

    // Act
    render(<SyncManager />);

    // Assert
    await waitFor(() => {
      expect(useSyncStore.getState().queue).toHaveLength(0);
    });
    expect(buildSupabaseMutationMock).toHaveBeenCalledTimes(1);
  });

  it('inserts the splits of an offline sale exactly once', async () => {
    // Arrange
    salesInsertMock.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({ data: { id: 'real-sale' }, error: null }),
      }),
    });
    saleSplitsInsertMock.mockResolvedValue({ error: null });
    enqueue('sales', 'INSERT', { tempId: 'temp-s1' }, 'sale:2026-01-01:1');
    enqueue(
      'sale_payment_splits',
      'INSERT',
      {
        isSplit: true,
        parentId: 'temp-s1',
        splits: [{ sale_id: 'temp-s1', amount: 10 }],
      },
      'sale-splits:temp-s1',
      ['sale:2026-01-01:1']
    );

    // Act
    render(<SyncManager />);

    // Assert
    await waitFor(() => {
      expect(useSyncStore.getState().queue).toHaveLength(0);
    });
    expect(saleSplitsInsertMock).toHaveBeenCalledTimes(1);
    expect(saleSplitsInsertMock).toHaveBeenCalledWith([
      { sale_id: 'real-sale', amount: 10 },
    ]);
    expect(buildSupabaseMutationMock).not.toHaveBeenCalled();
  });

  it('skips the dependents of a failed action but keeps syncing unrelated ones', async () => {
    // Arrange
    buildSupabaseMutationMock.mockImplementation((action: { table: string }) =>
      Promise.resolve(
        action.table === 'expenses'
          ? { error: { status: 400, message: 'bad' } }
          : { error: null, insertedId: 'real-customer' }
      )
    );
    enqueue('expenses', 'INSERT', { tempId: 'temp-e1' }, 'expense:temp-e1');
    enqueue(
      'expense_payment_splits',
      'INSERT',
      { isSplit: true, parentId: 'temp-e1', splits: [] },
      'expense-splits:temp-e1',
      ['expense:temp-e1']
    );
    enqueue('customers', 'INSERT', { tempId: 'temp-c1' }, 'customer:temp-c1');

    // Act
    render(<SyncManager />);

    // Assert
    await waitFor(() => {
      expect(useSyncStore.getState().queue.map((a) => a.table)).toEqual([
        'expenses',
        'expense_payment_splits',
      ]);
    });
    const syncedTables = buildSupabaseMutationMock.mock.calls.map(
      ([action]) => (action as { table: string }).table
    );
    expect(syncedTables).toContain('customers');
    expect(syncedTables).not.toContain('expense_payment_splits');
  });

  it('does not hammer the database retrying a failing action in a loop', async () => {
    // Arrange
    buildSupabaseMutationMock.mockResolvedValue({
      error: { status: 400, message: 'bad' },
    });
    enqueue('tips', 'INSERT', { origin_id: 'temp-r1' }, 'tip:temp-r1');

    // Act
    render(<SyncManager />);
    await waitFor(() => {
      expect(buildSupabaseMutationMock).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const callsAfterSettling = buildSupabaseMutationMock.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Assert
    expect(callsAfterSettling).toBe(1);
    expect(buildSupabaseMutationMock).toHaveBeenCalledTimes(1);
    expect(useSyncStore.getState().queue).toHaveLength(1);
  });
});
