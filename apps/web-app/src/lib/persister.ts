import { get, set, del } from 'idb-keyval';
import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

export const REACT_QUERY_PERSIST_KEY = 'react-query-cache';

/**
 * Creates an IndexedDB persister for React Query using idb-keyval.
 * This is more robust than localStorage for mobile/tablet PWAs.
 */
export function createIDBPersister(idbValidKey = REACT_QUERY_PERSIST_KEY) {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } as Persister;
}

export async function clearPersistedQueryCache(
  idbValidKey = REACT_QUERY_PERSIST_KEY
): Promise<void> {
  await del(idbValidKey);
}
