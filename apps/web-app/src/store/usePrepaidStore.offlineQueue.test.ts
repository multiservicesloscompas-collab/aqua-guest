import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePrepaidStore } from './usePrepaidStore';
import { useSyncStore } from './useSyncStore';

const prepaidInsertMock = vi.fn();

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'prepaid_orders') {
      return {
        insert: prepaidInsertMock,
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

describe('usePrepaidStore offline queueing', () => {
  beforeEach(() => {
    prepaidInsertMock.mockReset();
    useSyncStore.getState().clearQueue();
    usePrepaidStore.setState({ prepaidOrders: [] });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues prepaid create and does not call supabase when offline', async () => {
    await usePrepaidStore.getState().addPrepaidOrder({
      customerName: 'Cliente Uno',
      customerPhone: '0414-0000000',
      liters: 40,
      amountBs: 120,
      amountUsd: 2.4,
      exchangeRate: 50,
      paymentMethod: 'efectivo',
      status: 'pendiente',
      datePaid: '2026-03-09',
      dateDelivered: undefined,
      notes: undefined,
    });

    expect(prepaidInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('prepaid_orders');
    expect(queue[0].type).toBe('INSERT');
    expect(usePrepaidStore.getState().prepaidOrders).toHaveLength(1);
  });
});
