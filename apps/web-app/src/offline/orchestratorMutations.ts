import { supabase } from '@/lib/supabaseClient';
import type { GlobalSyncAction } from './types';

interface GlobalSyncProcessResult {
  actionId: string;
  status: 'succeeded' | 'retry_scheduled' | 'failed' | 'skipped';
  action?: GlobalSyncAction;
  reason?: string;
}

interface SupabaseMutationResult {
  error: unknown;
  insertedId?: string;
}

const resolveInsertPayload = (
  action: GlobalSyncAction,
  tempIdToRealId: Map<string, string>
): Record<string, unknown> => {
  if (!action.payload.isSplit || !Array.isArray(action.payload.splits)) {
    const { tempId: _tempId, ...payload } = action.payload;
    return payload;
  }

  const parentTempId = action.payload.parentId;
  const resolvedParentId =
    typeof parentTempId === 'string'
      ? tempIdToRealId.get(parentTempId) ?? parentTempId
      : parentTempId;

  return {
    ...action.payload,
    splits: action.payload.splits.map((row: unknown) => {
      if (!row || typeof row !== 'object') {
        return row;
      }

      const nextRow = { ...(row as Record<string, unknown>) };
      if ('sale_id' in nextRow) nextRow.sale_id = resolvedParentId;
      if ('rental_id' in nextRow) nextRow.rental_id = resolvedParentId;
      if ('expense_id' in nextRow) nextRow.expense_id = resolvedParentId;

      return nextRow;
    }),
    parentId: resolvedParentId,
  };
};

const resolveOperationHint = (
  payload: Record<string, unknown>
): string | undefined => {
  const op = payload.__op;
  return typeof op === 'string' ? op : undefined;
};

const stripInternalPayloadFields = (
  payload: Record<string, unknown>
): Record<string, unknown> => {
  const { __op: _op, ...rest } = payload;
  return rest;
};

const resolveMutationId = (
  value: unknown,
  tempIdToRealId: Map<string, string>
): string | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return tempIdToRealId.get(value) ?? value;
};

export const buildSupabaseMutation = (
  action: GlobalSyncAction,
  tempIdToRealId: Map<string, string>
): Promise<SupabaseMutationResult> => {
  const tableClient = supabase.from(action.table);

  if (action.type === 'INSERT') {
    const payload = resolveInsertPayload(action, tempIdToRealId);
    const operationHint = resolveOperationHint(payload);
    const sanitizedPayload = stripInternalPayloadFields(payload);

    if (sanitizedPayload.isSplit && Array.isArray(sanitizedPayload.splits)) {
      return Promise.resolve(
        tableClient
          .insert(sanitizedPayload.splits)
          .then((response) => ({ error: response.error }))
      );
    }

    if (operationHint === 'upsert_on_date') {
      return Promise.resolve(
        tableClient
          .upsert(sanitizedPayload, { onConflict: 'date' })
          .then((response) => ({ error: response.error }))
      );
    }

    if (operationHint === 'upsert_on_breakpoint') {
      return Promise.resolve(
        tableClient
          .upsert(sanitizedPayload, { onConflict: 'breakpoint' })
          .then((response) => ({ error: response.error }))
      );
    }

    if (operationHint === 'upsert_on_origin') {
      return Promise.resolve(
        tableClient
          .upsert(sanitizedPayload, { onConflict: 'origin_type,origin_id' })
          .then((response) => ({ error: response.error }))
      );
    }

    return Promise.resolve(
      tableClient
        .insert(sanitizedPayload)
        .select('id')
        .single()
        .then((response) => ({
          error: response.error,
          insertedId:
            response.data && typeof response.data.id === 'string'
              ? response.data.id
              : undefined,
        }))
    );
  }

  if (action.type === 'UPDATE') {
    const id = resolveMutationId(action.payload.id, tempIdToRealId);
    if (!id) {
      return Promise.resolve({ error: { status: 400, message: 'Missing id' } });
    }

    const { id: _, ...changes } = action.payload;
    return Promise.resolve(
      tableClient
        .update(changes)
        .eq('id', id)
        .then((response) => ({ error: response.error }))
    );
  }

  if (action.type === 'DELETE') {
    const operationHint = resolveOperationHint(action.payload);

    if (operationHint === 'delete_by_parent_id') {
      const parentColumn =
        typeof action.payload.parentColumn === 'string'
          ? action.payload.parentColumn
          : null;
      const parentId = resolveMutationId(
        action.payload.parentId,
        tempIdToRealId
      );
      const parentScopeColumn =
        typeof action.payload.parentScopeColumn === 'string'
          ? action.payload.parentScopeColumn
          : null;
      const parentScopeValue = action.payload.parentScopeValue;

      if (!parentColumn || !parentId) {
        return Promise.resolve({
          error: { status: 400, message: 'Missing parent delete metadata' },
        });
      }

      if (parentScopeColumn && typeof parentScopeValue !== 'string') {
        return Promise.resolve({
          error: {
            status: 400,
            message: 'Missing parent scope metadata',
          },
        });
      }

      const deleteBuilder = tableClient.delete().eq(parentColumn, parentId);
      const scopedDeleteBuilder =
        parentScopeColumn && typeof parentScopeValue === 'string'
          ? deleteBuilder.eq(parentScopeColumn, parentScopeValue)
          : deleteBuilder;

      return Promise.resolve(
        scopedDeleteBuilder.then((response) => ({ error: response.error }))
      );
    }

    if (operationHint === 'delete_by_breakpoint') {
      const breakpoint = action.payload.breakpoint;
      if (typeof breakpoint !== 'number') {
        return Promise.resolve({
          error: { status: 400, message: 'Missing breakpoint' },
        });
      }

      return Promise.resolve(
        tableClient
          .delete()
          .eq('breakpoint', breakpoint)
          .then((response) => ({ error: response.error }))
      );
    }

    const id = resolveMutationId(action.payload.id, tempIdToRealId);
    if (!id) {
      return Promise.resolve({ error: { status: 400, message: 'Missing id' } });
    }

    return Promise.resolve(
      tableClient
        .delete()
        .eq('id', id)
        .then((response) => ({ error: response.error }))
    );
  }

  throw new Error(`Unsupported operation: ${action.type}`);
};

export const dedupeByIdempotencyKey = (
  queue: GlobalSyncAction[]
): { queue: GlobalSyncAction[]; skipped: GlobalSyncProcessResult[] } => {
  const seen = new Set<string>();
  const unique: GlobalSyncAction[] = [];
  const skipped: GlobalSyncProcessResult[] = [];

  for (const action of queue) {
    if (seen.has(action.idempotency.key)) {
      skipped.push({
        actionId: action.id,
        status: 'skipped',
        reason: 'duplicate-idempotency-key',
      });
      continue;
    }

    seen.add(action.idempotency.key);
    unique.push(action);
  }

  return { queue: unique, skipped };
};
