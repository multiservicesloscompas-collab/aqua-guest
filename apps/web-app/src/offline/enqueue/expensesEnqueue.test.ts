import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineExpenseCreate,
  enqueueOfflineExpenseDelete,
  enqueueOfflineExpenseUpdate,
} from './expensesEnqueue';

describe('expensesEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues create and returns expense with temp id', () => {
    const created = enqueueOfflineExpenseCreate(
      {
        date: '2026-03-09',
        description: 'Compra cloro',
        amount: 250,
        category: 'insumos',
        paymentMethod: 'pago_movil',
        notes: 'Proveedor local',
      },
      '2026-03-09T00:00:00.000Z'
    );

    expect(created.id).toContain('temp-');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('expenses');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].idempotency.businessKey).toBe(`expense:${created.id}`);
  });

  it('enqueues update/delete with temp dependency key', () => {
    const tempId = 'temp-expense-1';

    enqueueOfflineExpenseUpdate(tempId, { amount: 300 });
    enqueueOfflineExpenseDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([`expense:${tempId}`]);
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([`expense:${tempId}`]);
  });
});
