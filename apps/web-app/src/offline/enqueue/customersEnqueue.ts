import type { Customer, CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';
import { useSyncStore } from '@/store/useSyncStore';

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `customer:${id}`;

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
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'customers',
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
