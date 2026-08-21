import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CustomerUpdate,
  RentalShiftConfig,
  WasherRental,
} from '@aqua-guest/domain';
import { SHIFT_FALLBACKS, SHIFT_UUID } from '@aqua-guest/domain';
import { rentalsDataService } from '@/services/RentalsDataService';
import { tipsDataService } from '@/services/tips/TipDataService';
import { createCurrencyConverter } from '@/services/CurrencyService';

import {
  type RentalState,
  buildRentalWriteContext,
} from './useRentalStore.core';
import {
  addRentalAction,
  updateRentalAction,
  deleteRentalAction,
} from './useRentalStore.actions';
import {
  addShiftAction,
  deleteShiftAction,
  loadShiftsAction,
  updateShiftAction,
} from './useRentalStore.shifts';
import { useConfigStore } from './useConfigStore';
import { useTipStore } from './useTipStore';
import {
  enqueueOfflineRentalTipDelete,
  enqueueOfflineRentalTipUpsert,
} from '@/offline/enqueue/rentalsEnqueue';
import type { Tip } from '@/types/tips';

function upsertRentalTipInStore(nextTip: Tip) {
  const tipStore = useTipStore.getState();
  const nextTips = tipStore.tips.filter(
    (tip) =>
      tip.id !== nextTip.id &&
      !(tip.originType === 'rental' && tip.originId === nextTip.originId)
  );

  tipStore.setTips([...nextTips, nextTip]);
}

export type {
  RentalState,
  CustomerUpdate,
};
export { buildRentalWriteContext };

export const useRentalStore = create<RentalState>()(
  persist(
    (set, get) => ({
      rentals: [],
      loadingRentalsByRange: {},

      shifts: [
        SHIFT_FALLBACKS[SHIFT_UUID.medio],
        SHIFT_FALLBACKS[SHIFT_UUID.completo],
        SHIFT_FALLBACKS[SHIFT_UUID.doble],
      ],
      loadingShifts: false,

      addRental: async (rental, tipInput) => {
        const createdRental = await addRentalAction(rental, tipInput, set, get);

        if (tipInput && tipInput.amountBs > 0) {
          const exchangeRateUsed =
            useConfigStore.getState().config.exchangeRate;
          const amountUsd = createCurrencyConverter(exchangeRateUsed).toUsd(
            tipInput.amountBs
          );
          const tip = await tipsDataService.upsertTipForOrigin({
            originType: 'rental',
            originId: createdRental.id,
            tipDate: createdRental.date,
            amountBs: tipInput.amountBs,
            amountUsd,
            exchangeRateUsed,
            capturePaymentMethod: tipInput.capturePaymentMethod,
            notes: tipInput.notes,
          });
          upsertRentalTipInStore(tip);
        }

        return createdRental;
      },
      updateRental: async (id, updates, tipInput) => {
        await updateRentalAction(id, updates, tipInput, set, get);

        if (tipInput === null) {
          if (!window.navigator.onLine) {
            enqueueOfflineRentalTipDelete(id);
            return;
          }

          await tipsDataService.deleteTipByOrigin('rental', id);
          useTipStore.getState().removeTipByOrigin('rental', id);
          return;
        }

        if (tipInput && tipInput.amountBs > 0) {
          const rental = get().rentals.find((item) => item.id === id);
          const exchangeRateUsed =
            useConfigStore.getState().config.exchangeRate;
          const amountUsd = createCurrencyConverter(exchangeRateUsed).toUsd(
            tipInput.amountBs
          );

          if (!window.navigator.onLine) {
            enqueueOfflineRentalTipUpsert({
              rentalId: id,
              tipDate: rental?.date ?? updates.date ?? '',
              amountBs: tipInput.amountBs,
              amountUsd,
              exchangeRateUsed,
              capturePaymentMethod: tipInput.capturePaymentMethod,
              notes: tipInput.notes,
            });
            return;
          }

          const tip = await tipsDataService.upsertTipForOrigin({
            originType: 'rental',
            originId: id,
            tipDate: rental?.date ?? updates.date ?? '',
            amountBs: tipInput.amountBs,
            amountUsd,
            exchangeRateUsed,
            capturePaymentMethod: tipInput.capturePaymentMethod,
            notes: tipInput.notes,
          });
          upsertRentalTipInStore(tip);
        }
      },
      deleteRental: (id) =>
        deleteRentalAction(id, set, get, async (originType, originId) => {
          await tipsDataService.deleteTipByOrigin(originType, originId);
          useTipStore.getState().removeTipByOrigin(originType, originId);
        }),

      getRentalsByDate: (date) =>
        get().rentals.filter((rental) => rental.date === date),

      getActiveRentalsForDate: (date) =>
        get().rentals.filter(
          (rental) => rental.date === date && rental.status !== 'finalizado'
        ),

      loadRentalsByDate: async (date) => {
        try {
          const rentals = await rentalsDataService.loadRentalsByDate(date);
          set((state) => {
            const fetchedIds = new Set(rentals.map((r) => r.id));
            const existingRentals = state.rentals.filter(
              (r) => r.date !== date && !fetchedIds.has(r.id)
            );
            return { rentals: [...existingRentals, ...rentals] };
          });
          return rentals;
        } catch (err) {
          console.error('Error loading rentals by date:', err);
          throw err;
        }
      },

      loadRentalsByDateRange: async (startDate, endDate) => {
        const rangeKey = `${startDate}_${endDate}`;
        if (get().loadingRentalsByRange[rangeKey]) return;
        set((state) => ({
          loadingRentalsByRange: {
            ...state.loadingRentalsByRange,
            [rangeKey]: true,
          },
        }));

        try {
          const dates: string[] = [];
          const current = new Date(startDate + 'T12:00:00');
          const end = new Date(endDate + 'T12:00:00');
          while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
          }

          if (dates.length === 0) return;

          const rentalsMap = await rentalsDataService.loadRentalsByDateRange(
            startDate,
            endDate
          );
          const allRentals: WasherRental[] = [];
          for (const entries of rentalsMap.values()) {
            allRentals.push(...entries);
          }

          const dedupRentals = (
            currentRentals: WasherRental[],
            newRentals: WasherRental[],
            datesToExclude: Set<string>
          ): WasherRental[] => {
            const map = new Map<string, WasherRental>();
            currentRentals
              .filter((rental) => {
                const effectiveDate = rental.datePaid || rental.date;
                return !datesToExclude.has(effectiveDate);
              })
              .forEach((rental) => map.set(rental.id, rental));
            newRentals.forEach((rental) => map.set(rental.id, rental));
            return Array.from(map.values());
          };

          const loadedDatesSet = new Set(dates);
          set((state) => ({
            rentals: dedupRentals(state.rentals, allRentals, loadedDatesSet),
          }));
        } catch (err) {
          console.error('Error loading rentals for date range:', err);
        } finally {
          set((state) => ({
            loadingRentalsByRange: {
              ...state.loadingRentalsByRange,
              [rangeKey]: false,
            },
          }));
        }
      },

      loadShifts: async () => loadShiftsAction(set, get),
      addShift: async (shift) => addShiftAction(shift, set, get),
      updateShift: async (id, updates) => updateShiftAction(id, updates, set, get),
      deleteShift: async (id) => deleteShiftAction(id, set, get),
    }),
    {
      name: 'aquagest-rental-storage',
      partialize: (state) => ({
        shifts: state.shifts,
      }),
    }
  )
);

void useRentalStore
  .getState()
  .loadShifts()
  .catch((err: unknown) => {
    console.error(err);
  });

export const selectShiftConfigById = (
  shifts: ReadonlyArray<RentalShiftConfig>
) => {
  return (id: string | null | undefined) => {
    if (!id) return null;

    const fromStore = shifts.find((shift) => shift.id === id);
    if (fromStore) {
      return fromStore;
    }

    return SHIFT_FALLBACKS[id] ?? null;
  };
};
