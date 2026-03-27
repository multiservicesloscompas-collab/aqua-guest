import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineRentalDelete,
  enqueueOfflineRentalUpdate,
} from './rentalsEnqueue';

describe('rentalsEnqueue update/delete', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues rental update with dependency when id is temp', () => {
    enqueueOfflineRentalUpdate({
      id: 'temp-rental-1',
      payload: { status: 'enviado' },
    });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('washer_rentals');
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual(['rental:temp-rental-1']);
  });

  it('enqueues rental delete with dependency when id is temp', () => {
    enqueueOfflineRentalDelete({ id: 'temp-rental-1' });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('washer_rentals');
    expect(queue[0].type).toBe('DELETE');
    expect(queue[0].dependencies.dependsOn).toEqual(['rental:temp-rental-1']);
  });
});
