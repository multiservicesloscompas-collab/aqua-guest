import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineWashingMachineCreate,
  enqueueOfflineWashingMachineDelete,
  enqueueOfflineWashingMachineUpdate,
} from './machinesEnqueue';

describe('machinesEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues create and returns machine with temp id', () => {
    const created = enqueueOfflineWashingMachineCreate({
      name: 'Lavadora 1',
      kg: 12,
      brand: 'Mabe',
      status: 'disponible',
      isAvailable: true,
    });

    expect(created.id).toContain('temp-');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('washing_machines');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].idempotency.businessKey).toBe(`machine:${created.id}`);
  });

  it('enqueues update/delete with temp dependency key', () => {
    const tempId = 'temp-machine-1';

    enqueueOfflineWashingMachineUpdate(tempId, { status: 'mantenimiento' });
    enqueueOfflineWashingMachineDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([`machine:${tempId}`]);
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([`machine:${tempId}`]);
  });
});
