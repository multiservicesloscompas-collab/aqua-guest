/**
 * useRentalStore.ts
 * Thin Zustand store barrel — wires together types from .core and
 * action implementations from .supabase. All consumers can import
 * from this file and nothing breaks.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WasherRental } from '@/types';
import { rentalsDataService } from '@/services/RentalsDataService';

import {
  type RentalState,
  type RentalRow,
  type RentalInsert,
  type RentalUpdate,
  type CustomerUpdate,
  buildRentalWriteContext,
  mapRentalRowToWasherRental,
} from './useRentalStore.core';
import {
  replaceRentalSplits,
  fetchRentalSplits,
} from './useRentalStore.supabase';
import {
  addRentalAction,
  updateRentalAction,
  deleteRentalAction,
} from './useRentalStore.actions';

// Re-export everything so existing import paths continue to work
export type {
  RentalState,
  RentalRow,
  RentalInsert,
  RentalUpdate,
  CustomerUpdate,
};
export {
  buildRentalWriteContext,
  mapRentalRowToWasherRental,
  replaceRentalSplits,
  fetchRentalSplits,
};

export const useRentalStore = create<RentalState>()(
  persist(
    (set, get) => ({
      rentals: [],
      loadingRentalsByRange: {},

      addRental: (rental) => addRentalAction(rental, set, get),
      updateRental: (id, updates) => updateRentalAction(id, updates, set, get),
      deleteRental: (id) => deleteRentalAction(id, set, get),

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
    }),
    {
      name: 'aquagest-rental-storage',
    }
  )
);
