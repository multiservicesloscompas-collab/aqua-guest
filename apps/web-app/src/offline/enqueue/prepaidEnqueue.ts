import type { PrepaidOrder } from '@/types';
import { useSyncStore } from '@/store/useSyncStore';
import { generateTempId } from './tempId';

interface EnqueueOfflinePrepaidCreateInput {
  payload: Record<string, unknown>;
  order: Omit<PrepaidOrder, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: string;
  updatedAt: string;
  actionSource?: string;
}

interface EnqueueOfflinePrepaidUpdateInput {
  id: string;
  payload: Record<string, unknown>;
  actionSource?: string;
}

const buildEntityBusinessKey = (id: string) => `prepaid:${id}`;

export const enqueueOfflinePrepaidCreate = (
  input: EnqueueOfflinePrepaidCreateInput
): PrepaidOrder => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'prepaid_orders',
    payload: { ...input.payload, tempId },
    enqueueSource: input.actionSource ?? 'prepaid/addPrepaidOrder',
    businessKey,
  });

  return {
    ...input.order,
    id: tempId,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
};

export const enqueueOfflinePrepaidUpdate = (
  input: EnqueueOfflinePrepaidUpdateInput
) => {
  const businessKey = buildEntityBusinessKey(input.id);

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'prepaid_orders',
    payload: {
      id: input.id,
      ...input.payload,
    },
    enqueueSource: input.actionSource ?? 'prepaid/updatePrepaidOrder',
    businessKey,
    dependencyKeys: input.id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflinePrepaidDelete = (
  id: string,
  actionSource = 'prepaid/deletePrepaidOrder'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'prepaid_orders',
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
