import { useNetworkState } from '@/hooks/useNetworkState';
import { supabase } from '@/lib/supabaseClient';
import {
  getOfflineFeatureFlags,
  resolveOfflineSyncProcessorMode,
} from '@/offline/featureFlags';
import { processGlobalOfflineQueue } from '@/offline/globalOrchestrator';
import {
  buildQueueObservabilitySnapshot,
  summarizeProcessResults,
} from '@/offline/observability';
import { buildSupabaseMutation } from '@/offline/orchestratorMutations';
import { useSyncStore } from '@/store/useSyncStore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const SyncManager: React.FC = () => {
  const isOnline = useNetworkState();
  const { queue, removeFromQueue, replaceQueue } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const inFlightActionIdsRef = useRef<Set<string>>(new Set());
  const wasOnlineRef = useRef(false);

  const stalledQueueLengthRef = useRef<number | null>(null);
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

    const tempIdToRealId = new Map<string, string>();
    const handledActionIds = new Set<string>();
    const blockedBusinessKeys = new Set<string>();
    let hadFailure = false;

    for (const action of pendingActions) {
      if (handledActionIds.has(action.id)) {
        continue;
      }

      if (
        blockedBusinessKeys.has(action.idempotency.businessKey) ||
        action.dependencies.dependsOn.some((key) =>
          blockedBusinessKeys.has(key)
        )
      ) {
        continue;
      }

      try {
        inFlightActionIdsRef.current.add(action.id);

        if (action.table === 'sales' && action.type === 'INSERT') {
          const { tempId, ...payload } = action.payload;

          // 1. Insertar la venta principal
          const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(payload)
            .select('*')
            .single();

          if (saleError) throw saleError;

          if (typeof tempId === 'string') {
            tempIdToRealId.set(tempId, saleData.id);
          }

          // 2. Buscar si hay splits pendientes para esta venta (tempId)
          const splitAction = pendingActions.find(
            (a) => a.payload?.parentId === tempId && a.payload?.isSplit
          );

          if (splitAction) {
            const { splits } = splitAction.payload;
            if (!Array.isArray(splits)) {
              continue;
            }
            // Reemplazar tempId por el ID real de Supabase
            const finalSplits = splits.map((s) => ({
              ...s,
              sale_id: saleData.id, // Asumiendo que sale_id es la FK
            }));

            const { error: splitError } = await supabase
              .from(splitAction.table)
              .insert(finalSplits);

            handledActionIds.add(splitAction.id);

            if (splitError) {
              console.error('Error sincronizando splits:', splitError);
              // No arrojamos para no trabar la venta, pero el usuario debería saberlo
            } else {
              removeFromQueue(splitAction.id);
              inFlightActionIdsRef.current.delete(splitAction.id);
            }
          }
          removeFromQueue(action.id);
          inFlightActionIdsRef.current.delete(action.id);
          continue;
        }

        const response = await buildSupabaseMutation(action, tempIdToRealId);
        if (response.error) throw response.error;

        if (
          action.type === 'INSERT' &&
          typeof action.payload.tempId === 'string' &&
          response.insertedId
        ) {
          tempIdToRealId.set(action.payload.tempId, response.insertedId);
        }

        removeFromQueue(action.id);
        inFlightActionIdsRef.current.delete(action.id);
      } catch (error) {
        console.error('Error sincronizando acción:', action, error);
        blockedBusinessKeys.add(action.idempotency.businessKey);
        hadFailure = true;
      }
    }

    inFlightActionIdsRef.current = new Set();
    stalledQueueLengthRef.current = hadFailure
      ? useSyncStore.getState().queue.length
      : null;
    setIsSyncing(false);
    if (queueRef.current.length === 0) {
      toast.success('Sincronización completada con éxito.');
    }
  }, [processorMode, removeFromQueue, replaceQueue]);

  useEffect(() => {
    if (!isOnline) {
      stalledQueueLengthRef.current = null;
    }

    if (
      isOnline &&
      queue.length > 0 &&
      !isSyncing &&
      processorMode !== 'disabled' &&
      stalledQueueLengthRef.current !== queue.length
    ) {
      void processQueue();
    }
  }, [isOnline, isSyncing, processorMode, processQueue, queue.length]);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;

    if (!isOnline || wasOnline) {
      return;
    }

    const refreshReadSyncRoots = async () => {
      try {
        await Promise.all([
          supabase.from('companies').select('*'),
          supabase.from('user_profiles').select('*'),
        ]);
      } catch (error) {
        console.error('[offline-sync] reconnect read-sync failed', error);
      }
    };

    void refreshReadSyncRoots();
  }, [isOnline]);

  return null; // Componente lógico, no renderiza nada
};
