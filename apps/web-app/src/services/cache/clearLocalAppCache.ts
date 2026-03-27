import { clearPersistedQueryCache } from '@/lib/persister';
import { expensesDataService } from '@/services/ExpensesDataService';
import { rentalsDataService } from '@/services/RentalsDataService';
import { salesDataService } from '@/services/SalesDataService';
import { useSyncStore } from '@/store/useSyncStore';

const AQUAGEST_STORAGE_PREFIX = 'aquagest-';
const APP_CACHE_NAME_PATTERNS = ['aquagest-', 'supabase-api-cache'];

const removeAquagestLocalStorageKeys = () => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  const storage = globalThis.localStorage;
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(AQUAGEST_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
};

const clearBrowserCacheStorage = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  const appCacheKeys = cacheKeys.filter((cacheName) =>
    APP_CACHE_NAME_PATTERNS.some((pattern) => cacheName.includes(pattern))
  );

  await Promise.all(
    appCacheKeys.map((cacheName) => window.caches.delete(cacheName))
  );
};

export async function clearLocalAppCache(): Promise<void> {
  salesDataService.clearCache();
  rentalsDataService.clearCache();
  expensesDataService.clearCache();

  useSyncStore.getState().clearQueue();

  removeAquagestLocalStorageKeys();

  await Promise.all([clearPersistedQueryCache(), clearBrowserCacheStorage()]);
}
