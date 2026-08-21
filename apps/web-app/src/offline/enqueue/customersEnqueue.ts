import type { Customer, CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';
import {
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `customer:${id}`;

export const enqueueOfflineCustomerCreate = (
  customer: CustomerDraft,
  actionSource = 'customers/addCustomer'
): Customer => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  enqueueOfflineRepositoryCreate({
    table: 'customers',
    repository: 'customers',
    input: {
      tempId,
      ...customer,
    },
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

  enqueueOfflineRepositoryUpdate({
    table: 'customers',
    repository: 'customers',
    id,
    updates,
    payload: updates,
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineCustomerDelete = (
  id: string,
  actionSource = 'customers/deleteCustomer'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryDelete({
    table: 'customers',
    repository: 'customers',
    id,
    enqueueSource: actionSource,
    businessKey,
  });
};
