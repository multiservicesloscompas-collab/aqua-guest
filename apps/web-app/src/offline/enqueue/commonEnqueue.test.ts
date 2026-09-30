import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import { enqueueEntityDelete } from './commonEnqueue';

describe('enqueueEntityDelete', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues a DELETE with the table, the id payload and the source', () => {
    // Arrange / Act
    enqueueEntityDelete({
      table: 'customers',
      id: 'customer-1',
      businessKey: 'customer:customer-1',
      actionSource: 'customers/deleteCustomer',
    });

    // Assert
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      type: 'DELETE',
      table: 'customers',
      payload: { id: 'customer-1' },
      status: 'queued',
      enqueueSource: 'customers/deleteCustomer',
      idempotency: { businessKey: 'customer:customer-1' },
    });
  });

  it('depends on the record own create when the id is temporary', () => {
    // Arrange / Act
    enqueueEntityDelete({
      table: 'customers',
      id: 'temp-abc123',
      businessKey: 'customer:temp-abc123',
      actionSource: 'customers/deleteCustomer',
    });

    // Assert
    expect(useSyncStore.getState().queue[0].dependencies.dependsOn).toEqual([
      'customer:temp-abc123',
    ]);
  });

  it('has no dependencies when the id comes from the server', () => {
    // Arrange / Act
    enqueueEntityDelete({
      table: 'customers',
      id: '7f9c2a54-1b3e-4d6a-9c8f-0a1b2c3d4e5f',
      businessKey: 'customer:7f9c2a54-1b3e-4d6a-9c8f-0a1b2c3d4e5f',
      actionSource: 'customers/deleteCustomer',
    });

    // Assert
    expect(useSyncStore.getState().queue[0].dependencies.dependsOn).toEqual([]);
  });

  it('builds the same idempotency key the persisted queue already uses', () => {
    // Arrange / Act
    enqueueEntityDelete({
      table: 'customers',
      id: 'temp-abc123',
      businessKey: 'customer:temp-abc123',
      actionSource: 'customers/deleteCustomer',
    });

    // Assert
    expect(useSyncStore.getState().queue[0].idempotency).toEqual({
      key: '492030e',
      payloadFingerprint: 'a0a1a565',
      businessKey: 'customer:temp-abc123',
    });
  });
});
