import type { Customer } from '@/types';
import { useSyncStore } from '@/store/useSyncStore';
import { generateTempId } from './tempId';
import { enqueueEntityDelete } from './commonEnqueue';
import type { CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';

export const buildCustomerBusinessKey = (id: string) => `customer:${id}`;
const buildEntityBusinessKey = buildCustomerBusinessKey;

export const enqueueOfflineCustomerCreate = (
  customer: CustomerDraft,
  actionSource = 'customers/addCustomer'
): Customer => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'customers',
    payload: {
      tempId,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    },
    enqueueSource: actionSource,
    businessKey,
  });

  return {
    id: tempId,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
  };
};

export const enqueueOfflineCustomerUpdate = (
  id: string,
  updates: CustomerUpdate,
  actionSource = 'customers/updateCustomer'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'customers',
    payload: {
      id,
      ...updates,
    },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineCustomerDelete = (
  id: string,
  actionSource = 'customers/deleteCustomer'
) =>
  enqueueEntityDelete({
    table: 'customers',
    id,
    businessKey: buildEntityBusinessKey(id),
    actionSource,
  });
