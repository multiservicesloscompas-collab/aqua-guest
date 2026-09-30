import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import { enqueueOfflineCustomerDelete } from './customersEnqueue';
import { enqueueOfflineExpenseDelete } from './expensesEnqueue';
import { enqueueOfflineWashingMachineDelete } from './machinesEnqueue';
import { enqueueOfflinePaymentBalanceDelete } from './paymentBalanceEnqueue';
import { enqueueOfflinePrepaidDelete } from './prepaidEnqueue';

// The queue is persisted on the device, so a delete action must keep exactly
// the same table, payload, business key and idempotency key across releases.
const TEMP_ID = 'temp-abc123';
const REAL_ID = '7f9c2a54-1b3e-4d6a-9c8f-0a1b2c3d4e5f';

interface DeleteCase {
  name: string;
  enqueue: (id: string, actionSource?: string) => void;
  table: string;
  prefix: string;
  defaultSource: string;
  keys: Record<string, { key: string; payloadFingerprint: string }>;
}

const cases: DeleteCase[] = [
  {
    name: 'customers',
    enqueue: enqueueOfflineCustomerDelete,
    table: 'customers',
    prefix: 'customer',
    defaultSource: 'customers/deleteCustomer',
    keys: {
      [TEMP_ID]: { key: '492030e', payloadFingerprint: 'a0a1a565' },
      [REAL_ID]: { key: '6d289564', payloadFingerprint: 'd6aaf04d' },
    },
  },
  {
    name: 'machines',
    enqueue: enqueueOfflineWashingMachineDelete,
    table: 'washing_machines',
    prefix: 'machine',
    defaultSource: 'machines/deleteWashingMachine',
    keys: {
      [TEMP_ID]: { key: '178c79bc', payloadFingerprint: 'a0a1a565' },
      [REAL_ID]: { key: '67d94516', payloadFingerprint: 'd6aaf04d' },
    },
  },
  {
    name: 'expenses',
    enqueue: enqueueOfflineExpenseDelete,
    table: 'expenses',
    prefix: 'expense',
    defaultSource: 'expenses/deleteExpense',
    keys: {
      [TEMP_ID]: { key: 'c9cf798e', payloadFingerprint: 'a0a1a565' },
      [REAL_ID]: { key: '10f05be4', payloadFingerprint: 'd6aaf04d' },
    },
  },
  {
    name: 'prepaid',
    enqueue: enqueueOfflinePrepaidDelete,
    table: 'prepaid_orders',
    prefix: 'prepaid',
    defaultSource: 'prepaid/deletePrepaidOrder',
    keys: {
      [TEMP_ID]: { key: 'c249f81f', payloadFingerprint: 'a0a1a565' },
      [REAL_ID]: { key: '5763fad5', payloadFingerprint: 'd6aaf04d' },
    },
  },
  {
    name: 'payment balance',
    enqueue: enqueueOfflinePaymentBalanceDelete,
    table: 'payment_balance_transactions',
    prefix: 'payment-balance',
    defaultSource: 'paymentBalance/deletePaymentBalanceTransaction',
    keys: {
      [TEMP_ID]: { key: '6a4a7bc7', payloadFingerprint: 'a0a1a565' },
      [REAL_ID]: { key: '8721c88d', payloadFingerprint: 'd6aaf04d' },
    },
  },
];

describe.each(cases)(
  '$name delete enqueue',
  ({ enqueue, table, prefix, defaultSource, keys }) => {
    beforeEach(() => {
      useSyncStore.getState().clearQueue();
    });

    it.each([
      ['a temporary id', TEMP_ID, true],
      ['a server id', REAL_ID, false],
    ])('enqueues one queued DELETE for %s', (_label, id, isTemp) => {
      // Arrange
      const businessKey = `${prefix}:${id}`;

      // Act
      enqueue(id);

      // Assert
      const queue = useSyncStore.getState().queue;
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        type: 'DELETE',
        table,
        payload: { id },
        status: 'queued',
        enqueueSource: defaultSource,
        idempotency: { businessKey, ...keys[id] },
        dependencies: { dependsOn: isTemp ? [businessKey] : [] },
      });
    });

    it('uses the action source it receives instead of the default', () => {
      // Arrange
      const customSource = 'tests/customSource';

      // Act
      enqueue(REAL_ID, customSource);

      // Assert
      expect(useSyncStore.getState().queue[0].enqueueSource).toBe(customSource);
    });

    it('sends only the id in the payload', () => {
      // Arrange / Act
      enqueue(REAL_ID);

      // Assert
      expect(useSyncStore.getState().queue[0].payload).toEqual({
        id: REAL_ID,
      });
    });
  }
);
