import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerStore } from './useCustomerStore';
import { useSyncStore } from './useSyncStore';

const customerInsertMock = vi.fn();

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'customers') {
      return {
        insert: customerInsertMock,
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

describe('useCustomerStore offline queueing', () => {
  beforeEach(() => {
    customerInsertMock.mockReset();
    useSyncStore.getState().clearQueue();
    useCustomerStore.setState({ customers: [] });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues customer create and does not call supabase when offline', async () => {
    await useCustomerStore.getState().addCustomer({
      name: 'Cliente Uno',
      phone: '0414-0000000',
      address: 'Dirección',
    });

    expect(customerInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('customers');
    expect(queue[0].type).toBe('INSERT');
    expect(useCustomerStore.getState().customers).toHaveLength(1);
  });
});
