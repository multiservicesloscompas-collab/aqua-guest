import type { PrepaidOrder, PrepaidOrderDraft } from '@aqua-guest/domain';
import {
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

interface EnqueueOfflinePrepaidCreateInput {
  payload: Record<string, unknown>;
  order: PrepaidOrderDraft;
  createdAt: string;
  updatedAt: string;
  actionSource?: string;
}

interface EnqueueOfflinePrepaidUpdateInput {
  id: string;
  payload: Record<string, unknown>;
  actionSource?: string;
}

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `prepaid:${id}`;

export const enqueueOfflinePrepaidCreate = (
  input: EnqueueOfflinePrepaidCreateInput
): PrepaidOrder => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  enqueueOfflineRepositoryCreate({
    table: 'prepaid_orders',
    repository: 'prepaidOrders',
    input: {
      tempId,
      ...input.order,
    },
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

  enqueueOfflineRepositoryUpdate({
    table: 'prepaid_orders',
    repository: 'prepaidOrders',
    id: input.id,
    updates: input.payload,
    payload: input.payload,
    enqueueSource: input.actionSource ?? 'prepaid/updatePrepaidOrder',
    businessKey,
  });
};

export const enqueueOfflinePrepaidDelete = (
  id: string,
  actionSource = 'prepaid/deletePrepaidOrder'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryDelete({
    table: 'prepaid_orders',
    repository: 'prepaidOrders',
    id,
    enqueueSource: actionSource,
    businessKey,
  });
};
