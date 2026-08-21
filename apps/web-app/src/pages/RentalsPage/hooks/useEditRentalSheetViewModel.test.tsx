import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Customer, WasherRental } from '@/types';
import type { Tip } from '@/types/tips';
import { useEditRentalSheetViewModel } from './useEditRentalSheetViewModel';

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Carlos Ruiz',
    phone: '04121234567',
    address: 'Sector La Paz',
  },
  {
    id: 'cust-2',
    name: 'Maria Perez',
    phone: '04149998877',
    address: 'Av Bolivar',
  },
];

const mockMachines = [
  {
    id: 'machine-1',
    name: 'Lavadora 1',
    kg: 12,
    brand: 'Samsung',
    status: 'disponible' as const,
    isAvailable: true,
  },
  {
    id: 'machine-2',
    name: 'Lavadora 2',
    kg: 10,
    brand: 'LG',
    status: 'disponible' as const,
    isAvailable: true,
  },
];

const mockUpdateRental = vi.fn();
const mockLoadTipsByDateRange = vi.fn();

vi.mock('@/store/useCustomerStore', () => ({
  useCustomerStore: (selector?: (state: { customers: Customer[] }) => unknown) => {
    const state = { customers: mockCustomers };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/store/useMachineStore', () => ({
  useMachineStore: (selector?: (state: { washingMachines: typeof mockMachines }) => unknown) => {
    const state = { washingMachines: mockMachines };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      updateRental: mockUpdateRental,
      rentals: [],
      shifts: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      config: { exchangeRate: 50 },
      isMixedPaymentEnabled: () => true,
    };
    return selector ? selector(state) : state;
  },
}));

let currentTips: Tip[] = [];
vi.mock('@/store/useTipStore', () => ({
  useTipStore: Object.assign(
    (selector?: (state: unknown) => unknown) => {
      const state = {
        tips: currentTips,
        loadTipsByDateRange: mockLoadTipsByDateRange,
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({ tips: currentTips }),
    }
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function buildRental(overrides?: Partial<WasherRental>): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-15',
    customerId: 'cust-1',
    customerName: 'Carlos Ruiz',
    customerPhone: '04121234567',
    customerAddress: 'Sector La Paz',
    machineId: 'machine-1',
    shift: 'completo',
    deliveryTime: '09:00',
    pickupTime: '09:00',
    pickupDate: '2026-03-16',
    deliveryFee: 0,
    totalUsd: 6,
    paymentMethod: 'efectivo',
    status: 'agendado',
    isPaid: false,
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('useEditRentalSheetViewModel integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTips = [];
    mockUpdateRental.mockResolvedValue(undefined);
    mockLoadTipsByDateRange.mockResolvedValue(undefined);
  });

  it('exposes computed data, form state and catalog options', async () => {
    const rental = buildRental();
    const onOpenChange = vi.fn();

    const { result } = renderHook(() =>
      useEditRentalSheetViewModel({
        rental,
        open: true,
        onOpenChange,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedMachineId).toBe('machine-1');
    });

    expect(result.current.selectedShift).toBe('completo');
    expect(result.current.selectedPaymentMethod).toBe('efectivo');
    expect(result.current.customerName).toBe('Carlos Ruiz');
    expect(result.current.customerPhone).toBe('04121234567');
    expect(result.current.subtotalUsdText).toBe('6.00');
    expect(result.current.totalBs).toBe(300);
    expect(result.current.machineItems.length).toBe(2);
    expect(result.current.deliveryFeeOptions).toEqual([0, 1, 2, 3, 4, 5]);
    expect(result.current.timeSlots.length).toBeGreaterThan(0);
  });

  it('handles customer selection and clearing cleanly', async () => {
    const rental = buildRental();
    const { result } = renderHook(() =>
      useEditRentalSheetViewModel({
        rental,
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.selectedCustomerId).toBe('cust-1');
    });

    act(() => {
      result.current.onSelectCustomer('cust-2');
    });

    expect(result.current.selectedCustomerId).toBe('cust-2');
    expect(result.current.customerName).toBe('Maria Perez');
    expect(result.current.customerPhone).toBe('04149998877');
    expect(result.current.customerAddress).toBe('Av Bolivar');

    act(() => {
      result.current.onSelectCustomer(null);
    });

    expect(result.current.selectedCustomerId).toBeNull();
    expect(result.current.customerName).toBe('');
    expect(result.current.customerPhone).toBe('');
    expect(result.current.customerAddress).toBe('');
  });

  it('adjusts secondary payment method when selecting colliding primary payment method', async () => {
    const rental = buildRental({
      paymentMethod: 'pago_movil',
    });

    const { result } = renderHook(() =>
      useEditRentalSheetViewModel({
        rental,
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPaymentMethod).toBe('pago_movil');
    });

    expect(result.current.split2Method).toBe('efectivo');

    act(() => {
      result.current.onSelectPaymentMethod('efectivo');
    });

    expect(result.current.selectedPaymentMethod).toBe('efectivo');
    expect(result.current.split2Method).toBe('pago_movil');
  });

  it('toggles mixed payment on and off and updates split calculations', async () => {
    const rental = buildRental();
    const { result } = renderHook(() =>
      useEditRentalSheetViewModel({
        rental,
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isMixedPayment).toBe(false);
    });

    act(() => {
      result.current.onToggleMixedPayment();
      result.current.onChangeSplit1Amount('100');
    });

    expect(result.current.isMixedPayment).toBe(true);
    expect(result.current.split1Amount).toBe('100');

    act(() => {
      result.current.onToggleMixedPayment();
    });

    expect(result.current.isMixedPayment).toBe(false);
    expect(result.current.split1Amount).toBe('');
  });

  it('submits updates and closes the sheet on success', async () => {
    const rental = buildRental();
    const onOpenChange = vi.fn();

    const { result } = renderHook(() =>
      useEditRentalSheetViewModel({
        rental,
        open: true,
        onOpenChange,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedMachineId).toBe('machine-1');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockUpdateRental).toHaveBeenCalledTimes(1);
    expect(mockUpdateRental).toHaveBeenCalledWith(
      'rental-1',
      expect.objectContaining({
        machineId: 'machine-1',
        customerName: 'Carlos Ruiz',
      }),
      null
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
