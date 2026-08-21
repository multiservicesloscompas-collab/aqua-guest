import type { PaymentMethod, TipOriginType } from '@aqua-guest/domain';
import { useSyncStore } from '@/store/useSyncStore';

const withRepositoryPayload = (
  payload: Record<string, unknown>,
  repository: string,
  operation: string,
  input: Record<string, unknown>
) => ({
  ...payload,
  __repository: repository,
  __operation: operation,
  __input: input,
});

interface EnqueueBaseMutationInput {
  table: string;
  enqueueSource: string;
  businessKey: string;
  dependencyKeys?: string[];
}

interface EnqueueInsertInput extends EnqueueBaseMutationInput {
  payload: Record<string, unknown>;
}

interface EnqueueUpdateInput extends EnqueueBaseMutationInput {
  id: string;
  payload: Record<string, unknown>;
}

interface EnqueueDeleteInput extends EnqueueBaseMutationInput {
  id: string;
}

interface EnqueueRepositoryMutationInput extends EnqueueBaseMutationInput {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  repository: string;
  operation: string;
  input: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

interface EnqueueOriginTipDeleteInput {
  entityId: string;
  originType: TipOriginType;
  enqueueSource: string;
  businessKey: string;
}

interface EnqueueOriginTipUpsertInput {
  entityId: string;
  originType: TipOriginType;
  tipDate: string;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
  enqueueSource: string;
  businessKey: string;
  tempDependencyBusinessKey?: string;
}

const getTempDependencyKeys = (
  id: string,
  businessKey: string
): string[] | undefined => {
  return id.startsWith('temp-') ? [businessKey] : undefined;
};

export const createOfflineTempId = (): string =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

export const enqueueOfflineInsert = ({
  table,
  payload,
  enqueueSource,
  businessKey,
  dependencyKeys,
}: EnqueueInsertInput) => {
  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table,
    payload,
    enqueueSource,
    businessKey,
    dependencyKeys,
  });
};

export const enqueueOfflineUpdate = ({
  table,
  id,
  payload,
  enqueueSource,
  businessKey,
}: EnqueueUpdateInput) => {
  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table,
    payload: {
      id,
      ...payload,
    },
    enqueueSource,
    businessKey,
    dependencyKeys: getTempDependencyKeys(id, businessKey),
  });
};

export const enqueueOfflineDelete = ({
  table,
  id,
  enqueueSource,
  businessKey,
}: EnqueueDeleteInput) => {
  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table,
    payload: { id },
    enqueueSource,
    businessKey,
    dependencyKeys: getTempDependencyKeys(id, businessKey),
  });
};

export const enqueueOfflineRepositoryMutation = ({
  table,
  type,
  repository,
  operation,
  input,
  payload,
  enqueueSource,
  businessKey,
  dependencyKeys,
}: EnqueueRepositoryMutationInput) => {
  useSyncStore.getState().addToQueue({
    type,
    table,
    payload: withRepositoryPayload(payload ?? {}, repository, operation, input),
    enqueueSource,
    businessKey,
    dependencyKeys,
  });
};

export const enqueueOfflineRepositoryCreate = ({
  table,
  repository,
  input,
  payload,
  enqueueSource,
  businessKey,
  dependencyKeys,
}: Omit<EnqueueRepositoryMutationInput, 'type' | 'operation'>) => {
  enqueueOfflineRepositoryMutation({
    type: 'INSERT',
    table,
    repository,
    operation: 'create',
    input,
    payload,
    enqueueSource,
    businessKey,
    dependencyKeys,
  });
};

export const enqueueOfflineRepositoryUpdate = ({
  table,
  repository,
  id,
  updates,
  payload,
  enqueueSource,
  businessKey,
}: EnqueueBaseMutationInput & {
  repository: string;
  id: string;
  updates: Record<string, unknown>;
  payload?: Record<string, unknown>;
}) => {
  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table,
    repository,
    operation: 'update',
    input: { id, updates },
    payload: { ...(payload ?? {}), id },
    enqueueSource,
    businessKey,
    dependencyKeys: getTempDependencyKeys(id, businessKey),
  });
};

export const enqueueOfflineRepositoryDelete = ({
  table,
  repository,
  id,
  payload,
  enqueueSource,
  businessKey,
}: EnqueueBaseMutationInput & {
  repository: string;
  id: string;
  payload?: Record<string, unknown>;
}) => {
  enqueueOfflineRepositoryMutation({
    type: 'DELETE',
    table,
    repository,
    operation: 'delete',
    input: { id },
    payload: { ...(payload ?? {}), id },
    enqueueSource,
    businessKey,
    dependencyKeys: getTempDependencyKeys(id, businessKey),
  });
};

export const enqueueOfflineOriginTipDelete = ({
  entityId,
  originType,
  enqueueSource,
  businessKey,
}: EnqueueOriginTipDeleteInput) => {
  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'tips',
    payload: withRepositoryPayload({}, 'tips', 'deleteByOrigin', {
      originType,
      originId: entityId,
    }),
    enqueueSource,
    businessKey,
  });
};

export const enqueueOfflineOriginTipUpsert = ({
  entityId,
  originType,
  tipDate,
  amountBs,
  amountUsd,
  exchangeRateUsed,
  capturePaymentMethod,
  notes,
  enqueueSource,
  businessKey,
  tempDependencyBusinessKey,
}: EnqueueOriginTipUpsertInput) => {
  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'tips',
    payload: withRepositoryPayload(
      {},
      'tips',
      'upsertByOrigin',
      {
        originType,
        originId: entityId,
        tipDate,
        amountBs,
        amountUsd,
        exchangeRateUsed,
        capturePaymentMethod,
        notes,
      }
    ),
    enqueueSource,
    businessKey,
    dependencyKeys:
      entityId.startsWith('temp-') && tempDependencyBusinessKey
        ? [tempDependencyBusinessKey]
        : undefined,
  });
};
