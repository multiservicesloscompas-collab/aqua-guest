import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMachineStore } from './useMachineStore';
import { useSyncStore } from './useSyncStore';

const { machineInsertMock, machineSelectMock } = vi.hoisted(() => ({
  machineInsertMock: vi.fn(),
  machineSelectMock: vi.fn(async () => ({ data: [], error: null })),
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'washing_machines') {
      return {
        insert: machineInsertMock,
        select: machineSelectMock,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const client = { from };
  return {
    default: client,
    supabase: client,
  };
});

describe('useMachineStore offline queueing', () => {
  beforeEach(() => {
    machineInsertMock.mockReset();
    machineSelectMock.mockReset();
    machineSelectMock.mockImplementation(async () => ({
      data: [],
      error: null,
    }));
    useSyncStore.getState().clearQueue();
    useMachineStore.setState({ washingMachines: [] });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues machine create and does not call supabase when offline', async () => {
    await useMachineStore.getState().addWashingMachine({
      name: 'Lavadora 1',
      kg: 12,
      brand: 'Mabe',
      status: 'disponible',
      isAvailable: true,
    });

    expect(machineInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('washing_machines');
    expect(queue[0].type).toBe('INSERT');
    expect(useMachineStore.getState().washingMachines).toHaveLength(1);
  });
});
