import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LEGACY_SHIFT_CATALOG,
  type RentalShiftCatalogEntry,
  type RentalShiftDraft,
  type RentalShiftUpdate,
} from '@aqua-guest/domain';
import { rentalShiftsDataService } from '@/services/rentals/RentalShiftsDataService';
import { validateShiftDraft } from '@/utils/shiftValidation';

export const SHIFT_MANAGEMENT_OFFLINE_ERROR =
  'Los turnos solo se pueden gestionar con conexión';
export const SHIFT_INVALID_ERROR = 'Los datos del turno no son válidos';
export const SHIFT_LAST_REMAINING_ERROR =
  'Debe quedar al menos un turno disponible';

interface RentalShiftState {
  shifts: RentalShiftCatalogEntry[];
  loadShifts: () => Promise<void>;
  addShift: (draft: RentalShiftDraft) => Promise<RentalShiftCatalogEntry>;
  updateShift: (id: string, updates: RentalShiftUpdate) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
}

function assertOnline(): void {
  if (!window.navigator.onLine) throw new Error(SHIFT_MANAGEMENT_OFFLINE_ERROR);
}

function assertValid(draft: RentalShiftDraft): void {
  if (validateShiftDraft(draft).length > 0)
    throw new Error(SHIFT_INVALID_ERROR);
}

export function selectShiftCatalog(
  state: Pick<RentalShiftState, 'shifts'>
): ReadonlyArray<RentalShiftCatalogEntry> {
  return state.shifts.length > 0 ? state.shifts : LEGACY_SHIFT_CATALOG;
}

export function getShiftCatalog(): ReadonlyArray<RentalShiftCatalogEntry> {
  return selectShiftCatalog(useRentalShiftStore.getState());
}

export const useRentalShiftStore = create<RentalShiftState>()(
  persist(
    (set, get) => ({
      shifts: [],

      loadShifts: async () => {
        try {
          const shifts = await rentalShiftsDataService.listActive();
          if (shifts.length > 0) set({ shifts });
        } catch (error) {
          console.error('Error loading rental shifts:', error);
        }
      },

      addShift: async (draft) => {
        assertOnline();
        assertValid(draft);
        const created = await rentalShiftsDataService.create(draft);
        set((state) => ({ shifts: [...selectShiftCatalog(state), created] }));
        return created;
      },

      updateShift: async (id, updates) => {
        assertOnline();
        const current = selectShiftCatalog(get()).find(
          (shift) => shift.id === id
        );
        if (current) assertValid({ ...current, ...updates });
        await rentalShiftsDataService.update(id, updates);
        set((state) => ({
          shifts: selectShiftCatalog(state).map((shift) =>
            shift.id === id ? { ...shift, ...updates } : shift
          ),
        }));
      },

      deleteShift: async (id) => {
        assertOnline();
        if (selectShiftCatalog(get()).length <= 1) {
          throw new Error(SHIFT_LAST_REMAINING_ERROR);
        }
        await rentalShiftsDataService.softDelete(id);
        set((state) => ({
          shifts: selectShiftCatalog(state).filter((shift) => shift.id !== id),
        }));
      },
    }),
    { name: 'aquagest-rental-shift-storage' }
  )
);
