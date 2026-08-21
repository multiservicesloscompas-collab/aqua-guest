import type {
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate,
} from '@aqua-guest/domain';
import {
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `machine:${id}`;

export const enqueueOfflineWashingMachineCreate = (
  machine: WashingMachineDraft,
  actionSource = 'machines/addWashingMachine'
): WashingMachine => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  enqueueOfflineRepositoryCreate({
    table: 'washing_machines',
    repository: 'washingMachines',
    input: {
      tempId,
      ...machine,
    },
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
  updates: WashingMachineUpdate,
  actionSource = 'machines/updateWashingMachine'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryUpdate({
    table: 'washing_machines',
    repository: 'washingMachines',
    id,
    updates,
    payload: {
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
  });
};

export const enqueueOfflineWashingMachineDelete = (
  id: string,
  actionSource = 'machines/deleteWashingMachine'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryDelete({
    table: 'washing_machines',
    repository: 'washingMachines',
    id,
    enqueueSource: actionSource,
    businessKey,
  });
};
