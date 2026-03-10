import React, { useEffect, useRef, useState } from 'react';
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
  const wasOnlineRef = useRef(false);
  const flags = getOfflineFeatureFlags();
  const processorMode = resolveOfflineSyncProcessorMode(flags);

  useEffect(() => {
    if (
      isOnline &&
      queue.length > 0 &&
      !isSyncing &&
      processorMode !== 'disabled'
    ) {
      processQueue();
    }
  }, [isOnline, queue.length, processorMode]);

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

  const processQueue = async () => {
    setIsSyncing(true);

    console.log(`Iniciando sincronización de ${queue.length} elementos...`);

    if (processorMode === 'global') {
      const preSnapshot = buildQueueObservabilitySnapshot(queue);
      console.info('[offline-sync] pre-process snapshot', preSnapshot);

      const result = await processGlobalOfflineQueue({
        queue,
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

    // Path legado para rollout backward-safe cuando GLOBAL_OFFLINE_ORCHESTRATOR = false
    const pendingActions = [...queue]
      .filter((action) => !inFlightActionIdsRef.current.has(action.id))
      .sort((a, b) => a.enqueuedAt - b.enqueuedAt);

    for (const action of pendingActions) {
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

            if (splitError) {
              console.error('Error sincronizando splits:', splitError);
              // No arrojamos para no trabar la venta, pero el usuario debería saberlo
            } else {
              removeFromQueue(splitAction.id);
              inFlightActionIdsRef.current.delete(splitAction.id);
            }
          }

          // 3. Actualizar el estado local (Zustand) reemplazando la venta temporal por la real
          // Nota: Esto requiere que useWaterSalesStore tenga una forma de actualizar IDs o simplemente refrescar
          // Por ahora, solo informamos el éxito
          removeFromQueue(action.id);
          inFlightActionIdsRef.current.delete(action.id);
        }

        // Otras tablas se pueden agregar aquí
      } catch (error) {
        console.error('Error sincronizando acción:', action, error);
        // Si falla uno, paramos el procesamiento para evitar inconsistencias?
        // O seguimos con el siguiente? Por seguridad, paramos.
        break;
      }
    }

    inFlightActionIdsRef.current = new Set();
    setIsSyncing(false);
    if (queue.length === 0) {
      toast.success('Sincronización completada con éxito.');
      // Refrescar datos globales para asegurar consistencia
      // useWaterSalesStore.getState().loadSalesByDate(today);
    }
  };

  return null; // Componente lógico, no renderiza nada
};
