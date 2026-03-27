import type { WashingMachine } from '@/types';
import { useSyncStore } from '@/store/useSyncStore';

type MachineCreateInput = Omit<WashingMachine, 'id'>;
type MachineUpdateInput = Partial<Omit<WashingMachine, 'id'>>;

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `machine:${id}`;

export const enqueueOfflineWashingMachineCreate = (
  machine: MachineCreateInput,
  actionSource = 'machines/addWashingMachine'
): WashingMachine => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'washing_machines',
    payload: {
      tempId,
      name: machine.name,
      kg: machine.kg,
      brand: machine.brand,
      status: machine.status,
      is_available: machine.isAvailable,
    },
    enqueueSource: actionSource,
    businessKey,
  });

  return {
    id: tempId,
    ...machine,
  };
};

export const enqueueOfflineWashingMachineUpdate = (
  id: string,
  updates: MachineUpdateInput,
  actionSource = 'machines/updateWashingMachine'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'washing_machines',
    payload: {
      id,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.kg !== undefined ? { kg: updates.kg } : {}),
      ...(updates.brand !== undefined ? { brand: updates.brand } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.isAvailable !== undefined
        ? { is_available: updates.isAvailable }
        : {}),
    },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineWashingMachineDelete = (
  id: string,
  actionSource = 'machines/deleteWashingMachine'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'washing_machines',
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
