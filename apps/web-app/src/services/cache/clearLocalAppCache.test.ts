import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalAppCache } from './clearLocalAppCache';

const {
  clearPersistedQueryCacheMock,
  salesClearCacheMock,
  rentalsClearCacheMock,
  expensesClearCacheMock,
  syncClearQueueMock,
} = vi.hoisted(() => ({
  clearPersistedQueryCacheMock: vi.fn(),
  salesClearCacheMock: vi.fn(),
  rentalsClearCacheMock: vi.fn(),
  expensesClearCacheMock: vi.fn(),
  syncClearQueueMock: vi.fn(),
}));

vi.mock('@/lib/persister', () => ({
  clearPersistedQueryCache: clearPersistedQueryCacheMock,
}));

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    clearCache: salesClearCacheMock,
  },
}));

vi.mock('@/services/RentalsDataService', () => ({
  rentalsDataService: {
    clearCache: rentalsClearCacheMock,
  },
}));

vi.mock('@/services/ExpensesDataService', () => ({
  expensesDataService: {
    clearCache: expensesClearCacheMock,
  },
}));

vi.mock('@/store/useSyncStore', () => ({
  useSyncStore: {
    getState: () => ({
      clearQueue: syncClearQueueMock,
    }),
  },
}));

describe('clearLocalAppCache', () => {
  const getStorage = () =>
    (
      globalThis as unknown as {
        localStorage: {
          clear: () => void;
          setItem: (key: string, value: string) => void;
          getItem: (key: string) => string | null;
        };
      }
    ).localStorage;

  beforeEach(() => {
    clearPersistedQueryCacheMock.mockReset();
    salesClearCacheMock.mockReset();
    rentalsClearCacheMock.mockReset();
    expensesClearCacheMock.mockReset();
    syncClearQueueMock.mockReset();

    const storage = getStorage();
    storage.clear();
    storage.setItem('aquagest-core-storage', 'core');
    storage.setItem('aquagest-sync-queue', 'queue');
    storage.setItem('external-app-key', 'keep');
  });

  it('clears app-managed in-memory and persisted local cache state', async () => {
    const cacheDeleteMock = vi.fn().mockResolvedValue(true);
    const cacheKeysMock = vi
      .fn()
      .mockResolvedValue([
        'aquagest-static-v1',
        'supabase-api-cache-v2',
        'unrelated-third-party-cache',
      ]);

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        ...globalThis,
        caches: {
          keys: cacheKeysMock,
          delete: cacheDeleteMock,
        },
      },
    });

    clearPersistedQueryCacheMock.mockResolvedValueOnce(undefined);

    await clearLocalAppCache();

    const storage = getStorage();

    expect(salesClearCacheMock).toHaveBeenCalledTimes(1);
    expect(rentalsClearCacheMock).toHaveBeenCalledTimes(1);
    expect(expensesClearCacheMock).toHaveBeenCalledTimes(1);
    expect(syncClearQueueMock).toHaveBeenCalledTimes(1);
    expect(clearPersistedQueryCacheMock).toHaveBeenCalledTimes(1);

    expect(storage.getItem('aquagest-core-storage')).toBeNull();
    expect(storage.getItem('aquagest-sync-queue')).toBeNull();
    expect(storage.getItem('external-app-key')).toBe('keep');

    expect(cacheKeysMock).toHaveBeenCalledTimes(1);
    expect(cacheDeleteMock).toHaveBeenCalledWith('aquagest-static-v1');
    expect(cacheDeleteMock).toHaveBeenCalledWith('supabase-api-cache-v2');
    expect(cacheDeleteMock).not.toHaveBeenCalledWith(
      'unrelated-third-party-cache'
    );
  });

  it('skips Cache Storage cleanup when caches API is unavailable', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: globalThis,
    });

    clearPersistedQueryCacheMock.mockResolvedValueOnce(undefined);

    await clearLocalAppCache();

    expect(clearPersistedQueryCacheMock).toHaveBeenCalledTimes(1);
  });
});
