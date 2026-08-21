import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRentalStore } from '../useRentalStore';
import { useSyncStore } from '../useSyncStore';
import { enqueueOfflineRentalShiftCreate } from '@/offline/enqueue/shiftsEnqueue';

const {
  rentalShiftsGetAll,
  rentalShiftsCreate,
  rentalShiftsUpdate,
  rentalShiftsDelete,
} = vi.hoisted(() => ({
  rentalShiftsGetAll: vi.fn(),
  rentalShiftsCreate: vi.fn(),
  rentalShiftsUpdate: vi.fn(),
  rentalShiftsDelete: vi.fn(),
}));

vi.mock('@/offline/enqueue/shiftsEnqueue', () => ({
  enqueueOfflineRentalShiftCreate: vi.fn(() => ({
    id: 'temp-shift-1',
    label: 'Turno temporal',
    priceUsd: 5,
    hours: 10,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 1,
    isActive: true,
  })),
  enqueueOfflineRentalShiftUpdate: vi.fn(),
  enqueueOfflineRentalShiftDelete: vi.fn(),
}));

vi.mock('@/lib/app-repositories', () => ({
  appRepositories: {
    rentalShiftsRepository: {
      getAll: rentalShiftsGetAll,
      create: rentalShiftsCreate,
      update: rentalShiftsUpdate,
      delete: rentalShiftsDelete,
    },
  },
}));

describe('useRentalStore shifts slice', () => {
  beforeEach(() => {
    rentalShiftsGetAll.mockReset();
    rentalShiftsCreate.mockReset();
    rentalShiftsUpdate.mockReset();
    rentalShiftsDelete.mockReset();
    useSyncStore.getState().clearQueue();
    useRentalStore.setState({ shifts: [], loadingShifts: false });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true },
    });
  });

  describe('loadShifts', () => {
    it('hydrates the catalog from the repository', async () => {
      const remote = [
        {
          id: 'shift-1',
          label: 'Turno 1',
          priceUsd: 5,
          hours: 10,
          hasDivisaDiscount: false,
          divisaDiscountAmount: 1,
          isActive: true,
        },
      ];
      rentalShiftsGetAll.mockResolvedValueOnce(remote);

      await useRentalStore.getState().loadShifts();

      expect(useRentalStore.getState().shifts).toEqual(remote);
      expect(useRentalStore.getState().loadingShifts).toBe(false);
    });

    it('keeps the previous catalog and surfaces the error when the repository fails', async () => {
      rentalShiftsGetAll.mockRejectedValueOnce(new Error('network down'));
      useRentalStore.setState({
        shifts: [
          {
            id: 'cached',
            label: 'cached',
            priceUsd: 1,
            hours: 1,
            hasDivisaDiscount: false,
            divisaDiscountAmount: 1,
            isActive: true,
          },
        ],
      });

      await expect(useRentalStore.getState().loadShifts()).rejects.toThrow(
        'network down'
      );

      expect(useRentalStore.getState().shifts).toEqual([
        expect.objectContaining({ id: 'cached' }),
      ]);
      expect(useRentalStore.getState().loadingShifts).toBe(false);
    });
  });

  describe('addShift', () => {
    it('enqueues offline and updates the store optimistically when offline', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { onLine: false },
      });

      const created = await useRentalStore.getState().addShift({
        label: 'Turno temporal',
        priceUsd: 5,
        hours: 10,
        hasDivisaDiscount: false,
        divisaDiscountAmount: 1,
        isActive: true,
      });

      expect(enqueueOfflineRentalShiftCreate).toHaveBeenCalledTimes(1);
      expect(created.id).toBe('temp-shift-1');
      expect(useRentalStore.getState().shifts).toContainEqual(created);
    });

    it('persists online and stores the canonical row when online', async () => {
      const persisted = {
        id: 'persisted-1',
        label: 'Turno persistido',
        priceUsd: 9,
        hours: 12,
        hasDivisaDiscount: true,
        divisaDiscountAmount: 2,
        isActive: true,
      };
      rentalShiftsCreate.mockResolvedValueOnce(persisted);

      const created = await useRentalStore.getState().addShift({
        label: 'Turno persistido',
        priceUsd: 9,
        hours: 12,
        hasDivisaDiscount: true,
        divisaDiscountAmount: 2,
        isActive: true,
      });

      expect(rentalShiftsCreate).toHaveBeenCalledTimes(1);
      expect(created).toEqual(persisted);
      expect(useRentalStore.getState().shifts).toContainEqual(persisted);
    });
  });

  describe('updateShift', () => {
    it('enqueues offline and patches the local entry', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { onLine: false },
      });
      useRentalStore.setState({
        shifts: [
          {
            id: 'shift-1',
            label: 'Before',
            priceUsd: 5,
            hours: 10,
            hasDivisaDiscount: false,
            divisaDiscountAmount: 1,
            isActive: true,
          },
        ],
      });

      await useRentalStore.getState().updateShift('shift-1', { label: 'After' });

      const updated = useRentalStore
        .getState()
        .shifts.find((s) => s.id === 'shift-1');
      expect(updated?.label).toBe('After');
    });

    it('persists online and patches the local entry', async () => {
      useRentalStore.setState({
        shifts: [
          {
            id: 'shift-1',
            label: 'Before',
            priceUsd: 5,
            hours: 10,
            hasDivisaDiscount: false,
            divisaDiscountAmount: 1,
            isActive: true,
          },
        ],
      });
      rentalShiftsUpdate.mockResolvedValueOnce(undefined);

      await useRentalStore
        .getState()
        .updateShift('shift-1', { label: 'After', priceUsd: 6 });

      const updated = useRentalStore
        .getState()
        .shifts.find((s) => s.id === 'shift-1');
      expect(rentalShiftsUpdate).toHaveBeenCalledWith('shift-1', {
        label: 'After',
        priceUsd: 6,
      });
      expect(updated).toMatchObject({ label: 'After', priceUsd: 6 });
    });
  });

  describe('deleteShift', () => {
    it('removes the entry from the local catalog when online', async () => {
      useRentalStore.setState({
        shifts: [
          {
            id: 'shift-1',
            label: 'one',
            priceUsd: 1,
            hours: 1,
            hasDivisaDiscount: false,
            divisaDiscountAmount: 1,
            isActive: true,
          },
          {
            id: 'shift-2',
            label: 'two',
            priceUsd: 2,
            hours: 2,
            hasDivisaDiscount: false,
            divisaDiscountAmount: 1,
            isActive: true,
          },
        ],
      });
      rentalShiftsDelete.mockResolvedValueOnce(undefined);

      await useRentalStore.getState().deleteShift('shift-1');

      expect(rentalShiftsDelete).toHaveBeenCalledWith('shift-1');
      expect(useRentalStore.getState().shifts.map((s) => s.id)).toEqual([
        'shift-2',
      ]);
    });
  });
});
