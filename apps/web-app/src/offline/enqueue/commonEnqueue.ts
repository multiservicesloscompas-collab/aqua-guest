import { useSyncStore } from '@/store/useSyncStore';

interface EnqueueEntityDeleteParams {
  table: string;
  id: string;
  businessKey: string;
  actionSource: string;
}

export const enqueueEntityDelete = ({
  table,
  id,
  businessKey,
  actionSource,
}: EnqueueEntityDeleteParams): void => {
  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table,
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
