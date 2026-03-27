import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineCustomerCreate,
  enqueueOfflineCustomerDelete,
  enqueueOfflineCustomerUpdate,
} from './customersEnqueue';

describe('customersEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues customer create with temp id business key', () => {
    const created = enqueueOfflineCustomerCreate({
      name: 'Cliente Uno',
      phone: '0414-0000000',
      address: 'Dirección',
    });

    expect(created.id).toContain('temp-');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('customers');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].idempotency.businessKey).toBe(`customer:${created.id}`);
  });

  it('enqueues update/delete with temp dependency for in-session consistency', () => {
    const tempId = 'temp-customer-1';

    enqueueOfflineCustomerUpdate(tempId, { phone: '0414-1111111' });
    enqueueOfflineCustomerDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([`customer:${tempId}`]);
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([`customer:${tempId}`]);
  });
});
