import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSyncStore } from '@/store/useSyncStore';
import { useNetworkState } from '@/hooks/useNetworkState';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  getOfflineFeatureFlags,
  resolveOfflineSyncProcessorMode,
} from '@/offline/featureFlags';
import { processGlobalOfflineQueue } from '@/offline/globalOrchestrator';
import {
  buildQueueObservabilitySnapshot,
  summarizeProcessResults,
} from '@/offline/observability';

export const SyncManager: React.FC = () => {
  const isOnline = useNetworkState();
  const { queue, removeFromQueue, replaceQueue } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const inFlightActionIdsRef = useRef<Set<string>>(new Set());
  const queueRef = useRef(queue);
  const flags = getOfflineFeatureFlags();
  const processorMode = resolveOfflineSyncProcessorMode(flags);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const processQueue = useCallback(async () => {
    setIsSyncing(true);

    const currentQueue = queueRef.current;

    console.log(
      `Iniciando sincronización de ${currentQueue.length} elementos...`
    );

    if (processorMode === 'global') {
      const preSnapshot = buildQueueObservabilitySnapshot(currentQueue);
      console.info('[offline-sync] pre-process snapshot', preSnapshot);

      const result = await processGlobalOfflineQueue({
        queue: currentQueue,
        inFlightActionIds: inFlightActionIdsRef.current,
      });
      const runSummary = summarizeProcessResults(result.results);
      const postSnapshot = buildQueueObservabilitySnapshot(result.nextQueue);

      console.info('[offline-sync] process results', runSummary);
      console.info('[offline-sync] post-process snapshot', postSnapshot);

      replaceQueue(result.nextQueue);
      const failedCount = result.results.filter(
        (r) => r.status === 'failed'
      ).length;

      if (failedCount > 0) {
        toast.error(
          `Sincronización parcial: ${failedCount} acción(es) fallaron y quedaron en cola.`
        );
      } else if (result.results.length > 0 && result.nextQueue.length === 0) {
        toast.success('Sincronización completada con éxito.');
      }

      if (postSnapshot.deadLetterCount > 0) {
        toast.error(
          `Se detectaron ${postSnapshot.deadLetterCount} acción(es) en dead-letter queue.`
        );
      }

      inFlightActionIdsRef.current = new Set();
      setIsSyncing(false);
      return;
    }

    const pendingActions = [...currentQueue]
      .filter((action) => !inFlightActionIdsRef.current.has(action.id))
      .sort((a, b) => a.enqueuedAt - b.enqueuedAt);

    for (const action of pendingActions) {
      try {
        inFlightActionIdsRef.current.add(action.id);

        if (action.table === 'sales' && action.type === 'INSERT') {
          const { tempId, ...payload } = action.payload;

          const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(payload)
            .select('*')
            .single();

          if (saleError) throw saleError;

          const splitAction = pendingActions.find(
            (a) => a.payload?.parentId === tempId && a.payload?.isSplit
          );

          if (splitAction) {
            const { splits } = splitAction.payload;
            if (!Array.isArray(splits)) {
              continue;
            }
            const finalSplits = splits.map((s) => ({
              ...s,
              sale_id: saleData.id,
            }));

            const { error: splitError } = await supabase
              .from(splitAction.table)
              .insert(finalSplits);

            if (splitError) {
              console.error('Error sincronizando splits:', splitError);
            } else {
              removeFromQueue(splitAction.id);
              inFlightActionIdsRef.current.delete(splitAction.id);
            }
          }

          removeFromQueue(action.id);
          inFlightActionIdsRef.current.delete(action.id);
        }
      } catch (error) {
        console.error('Error sincronizando acción:', action, error);
        break;
      }
    }

    inFlightActionIdsRef.current = new Set();
    setIsSyncing(false);
    if (queueRef.current.length === 0) {
      toast.success('Sincronización completada con éxito.');
    }
  }, [processorMode, removeFromQueue, replaceQueue]);

  useEffect(() => {
    if (
      isOnline &&
      queue.length > 0 &&
      !isSyncing &&
      processorMode !== 'disabled'
    ) {
      void processQueue();
    }
  }, [isOnline, isSyncing, processorMode, processQueue, queue.length]);

  return null;
};
