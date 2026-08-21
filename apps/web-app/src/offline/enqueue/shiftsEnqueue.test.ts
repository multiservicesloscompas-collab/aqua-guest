import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineRentalShiftCreate,
  enqueueOfflineRentalShiftDelete,
  enqueueOfflineRentalShiftUpdate,
} from './shiftsEnqueue';

describe('shiftsEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues shift create and returns shift config with temp id', () => {
    const created = enqueueOfflineRentalShiftCreate({
      label: 'Turno Mañana',
      hours: 4,
      priceUsd: 10,
      hasDivisaDiscount: true,
      divisaDiscountAmount: 2,
      isActive: true,
    });

    expect(created.id).toContain('temp-');
    expect(created.label).toBe('Turno Mañana');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('rental_shifts');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].payload.__repository).toBe('rentalShifts');
    expect(queue[0].idempotency.businessKey).toBe(`rentalShift:${created.id}`);
  });

  it('enqueues update and delete with correct keys and dependencies', () => {
    const tempId = 'temp-shift-1';

    enqueueOfflineRentalShiftUpdate(tempId, {
      priceUsd: 12,
      isActive: false,
    });
    enqueueOfflineRentalShiftDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([`rentalShift:${tempId}`]);
    expect(queue[0].payload.__repository).toBe('rentalShifts');
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([`rentalShift:${tempId}`]);
    expect(queue[1].payload.__repository).toBe('rentalShifts');
  });
});
