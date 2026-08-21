import {
  SHIFT_FALLBACKS,
  SHIFT_UUID,
  type RentalShiftConfig,
  type RentalShiftConfigDraft,
  type RentalShiftConfigUpdate,
} from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import {
  enqueueOfflineRentalShiftCreate,
  enqueueOfflineRentalShiftDelete,
  enqueueOfflineRentalShiftUpdate,
} from '@/offline/enqueue/shiftsEnqueue';
import type { RentalState } from './useRentalStore.core';

type SetFn = (
  partial: Partial<RentalState> | ((state: RentalState) => Partial<RentalState>)
) => void;
type GetFn = () => RentalState;

export async function loadShiftsAction(
  set: SetFn,
  get: GetFn
): Promise<void> {
  set({ loadingShifts: true });
  try {
    const shifts = await appRepositories.rentalShiftsRepository.getAll();
    if (!shifts || shifts.length === 0) {
      set({
        shifts: [
          SHIFT_FALLBACKS[SHIFT_UUID.medio],
          SHIFT_FALLBACKS[SHIFT_UUID.completo],
          SHIFT_FALLBACKS[SHIFT_UUID.doble],
        ],
        loadingShifts: false,
      });
    } else {
      set({ shifts, loadingShifts: false });
    }
  } catch (err) {
    console.error('Error loading rental shifts:', err);
    set({ loadingShifts: false });

    const current = get().shifts;
    if (!current || current.length === 0) {
      set({
        shifts: [
          SHIFT_FALLBACKS[SHIFT_UUID.medio],
          SHIFT_FALLBACKS[SHIFT_UUID.completo],
          SHIFT_FALLBACKS[SHIFT_UUID.doble],
        ],
      });
    }
    throw err;
  }
}

export async function addShiftAction(
  shift: RentalShiftConfigDraft,
  set: SetFn,
  _get: GetFn
): Promise<RentalShiftConfig> {
  if (!window.navigator.onLine) {
    const optimistic = enqueueOfflineRentalShiftCreate(shift);
    set((state) => ({ shifts: [...state.shifts, optimistic] }));
    return optimistic;
  }

  const created = await appRepositories.rentalShiftsRepository.create(shift);
  set((state) => ({ shifts: [...state.shifts, created] }));
  return created;
}

export async function updateShiftAction(
  id: string,
  updates: RentalShiftConfigUpdate,
  set: SetFn,
  _get: GetFn
): Promise<void> {
  if (!window.navigator.onLine) {
    enqueueOfflineRentalShiftUpdate(id, updates);
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === id ? { ...shift, ...updates } : shift
      ),
    }));
    return;
  }

  await appRepositories.rentalShiftsRepository.update(id, updates);
  set((state) => ({
    shifts: state.shifts.map((shift) =>
      shift.id === id ? { ...shift, ...updates } : shift
    ),
  }));
}

export async function deleteShiftAction(
  id: string,
  set: SetFn,
  _get: GetFn
): Promise<void> {
  if (!window.navigator.onLine) {
    enqueueOfflineRentalShiftDelete(id);
    set((state) => ({
      shifts: state.shifts.filter((shift) => shift.id !== id),
    }));
    return;
  }

  await appRepositories.rentalShiftsRepository.delete(id);
  set((state) => ({
    shifts: state.shifts.filter((shift) => shift.id !== id),
  }));
}
