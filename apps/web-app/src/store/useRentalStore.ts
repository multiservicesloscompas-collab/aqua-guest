import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PaymentMethod,
  RentalShift,
  RentalStatus,
  WasherRental,
} from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import supabase from '@/lib/supabaseClient';
import { rentalsDataService } from '@/services/RentalsDataService';
import {
  PAYMENT_SPLIT_SCHEMA,
  type PaymentSplitRow,
  type RentalPaymentSplitInsertRow,
} from '@/services/payments/paymentSplitSchemaContract';
import { rentalPaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import {
  enqueueOfflineRental,
  enqueueOfflineRentalDelete,
  enqueueOfflineRentalPaymentSplitsDelete,
  enqueueOfflineRentalPaymentSplitsReplace,
  enqueueOfflineRentalUpdate,
} from '@/offline/enqueue/rentalsEnqueue';
import { useCustomerStore } from './useCustomerStore';

function buildRentalWriteContext(
  input: {
    paymentMethod: PaymentMethod;
    paymentSplits?: PaymentSplit[];
    totalUsd: number;
  },
  fallbackExchangeRate = 1
) {
  const exchangeRateUsed =
    input.paymentSplits?.find((split) => split.exchangeRateUsed)
      ?.exchangeRateUsed ?? fallbackExchangeRate;
  const totalBs = input.totalUsd * exchangeRateUsed;

  return preparePaymentWritePayload({
    paymentMethod: input.paymentMethod,
    paymentSplits: input.paymentSplits,
    totalBs,
    totalUsd: input.totalUsd,
    exchangeRate: exchangeRateUsed,
  });
}

async function replaceRentalSplits(
  rentalId: string,
  splits: PaymentSplit[]
): Promise<void> {
  const { error: deleteSplitsError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .delete()
    .eq(PAYMENT_SPLIT_SCHEMA.columns.rentalParentId, rentalId);
  if (deleteSplitsError) throw deleteSplitsError;

  const splitRows = rentalPaymentSplitAdapter.toInsertRows(
    rentalId,
    splits
  ) as RentalPaymentSplitInsertRow[];

  if (!splitRows.length) return;

  const { error: splitInsertError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .insert(splitRows);
  if (splitInsertError) throw splitInsertError;
}

async function fetchRentalSplits(rentalId: string): Promise<PaymentSplit[]> {
  const { data: splitData, error: splitSelectError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .select('payment_method, amount_bs, amount_usd, exchange_rate_used')
    .eq(PAYMENT_SPLIT_SCHEMA.columns.rentalParentId, rentalId);
  if (splitSelectError) throw splitSelectError;

  return rentalPaymentSplitAdapter.fromRows(
    (splitData ?? []) as PaymentSplitRow[]
  );
}

interface RentalRow {
  id: string;
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  payment_splits?: PaymentSplit[];
  status: RentalStatus;
  is_paid: boolean;
  date_paid?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type RentalInsert = {
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  status: RentalStatus;
  is_paid: boolean;
  date_paid: string | null;
  notes?: string;
};

type RentalUpdate = Partial<RentalInsert> & {
  customer_id?: string;
  updated_at?: string;
};

type CustomerUpdate = Partial<{
  name: string;
  phone: string;
  address: string;
}>;

interface RentalState {
  rentals: WasherRental[];
  loadingRentalsByRange: Record<string, boolean>;

  // Acciones de alquileres
  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateRental: (id: string, updates: Partial<WasherRental>) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;

  getRentalsByDate: (date: string) => WasherRental[];
  getActiveRentalsForDate: (date: string) => WasherRental[];

  // Utilidades
  loadRentalsByDate: (date: string) => Promise<WasherRental[]>;
  loadRentalsByDateRange: (startDate: string, endDate: string) => Promise<void>;
}

export const useRentalStore = create<RentalState>()(
  persist(
    (set, get) => ({
      rentals: [],
      loadingRentalsByRange: {},

      addRental: async (rental) => {
        try {
          let customerId = rental.customerId;

          if (!customerId) {
            if (!rental.customerName) {
              throw new Error(
                'Nombre de cliente requerido para crear el alquiler'
              );
            }

            const customerState = useCustomerStore.getState();
            const existingCustomer = customerState.customers.find(
              (c) => c.name.toLowerCase() === rental.customerName!.toLowerCase()
            );

            if (existingCustomer) {
              customerId = existingCustomer.id;
            } else {
              const { data: cdata, error: cerr } = await supabase
                .from('customers')
                .insert({
                  name: rental.customerName,
                  phone: rental.customerPhone,
                  address: rental.customerAddress,
                })
                .select('*')
                .single();

              if (cerr) throw cerr;
              if (!cdata) throw new Error('Error al crear el cliente');

              customerId = cdata.id;

              useCustomerStore.setState((state) => ({
                customers: [
                  ...state.customers,
                  {
                    id: cdata.id,
                    name: cdata.name,
                    phone: cdata.phone,
                    address: cdata.address,
                  },
                ],
              }));
            }
          }

          if (!customerId) {
            throw new Error('Customer ID is required for rental');
          }

          const splitWrite = buildRentalWriteContext({
            paymentMethod: rental.paymentMethod,
            paymentSplits: rental.paymentSplits,
            totalUsd: rental.totalUsd,
          });

          const payload: RentalInsert = {
            date: rental.date,
            customer_id: customerId,
            machine_id: rental.machineId,
            shift: rental.shift,
            delivery_time: rental.deliveryTime,
            pickup_time: rental.pickupTime,
            pickup_date: rental.pickupDate,
            delivery_fee: rental.deliveryFee,
            total_usd: rental.totalUsd,
            payment_method: splitWrite.paymentMethod,
            status: rental.status,
            is_paid: rental.isPaid,
            date_paid: rental.datePaid || null,
            notes: rental.notes || undefined,
          };

          if (!window.navigator.onLine) {
            const offlineRental = enqueueOfflineRental({
              payload,
              rental: {
                ...rental,
                customerId,
              },
              paymentSplits: splitWrite.paymentSplits,
            });

            set((state) => ({ rentals: [...state.rentals, offlineRental] }));
            return;
          }

          const { data, error } = await supabase
            .from('washer_rentals')
            .insert(payload)
            .select('*')
            .single();

          if (error) throw error;

          const rentalRow = data as RentalRow | null;
          if (!rentalRow) {
            throw new Error('Error al crear el alquiler');
          }

          await replaceRentalSplits(rentalRow.id, splitWrite.paymentSplits);
          const normalizedSplits = await fetchRentalSplits(rentalRow.id);

          const newRental: WasherRental = {
            id: rentalRow.id,
            date: rentalRow.date.substring(0, 10),
            customerId: rentalRow.customer_id,
            customerName: rental.customerName || '',
            customerPhone: rental.customerPhone || '',
            customerAddress: rental.customerAddress || '',
            machineId: rentalRow.machine_id,
            shift: rentalRow.shift,
            deliveryTime: rentalRow.delivery_time,
            pickupTime: rentalRow.pickup_time,
            pickupDate: rentalRow.pickup_date,
            deliveryFee: Number(rentalRow.delivery_fee),
            totalUsd: Number(rentalRow.total_usd),
            paymentMethod: splitWrite.paymentMethod,
            paymentSplits: normalizedSplits,
            status: rentalRow.status,
            isPaid: rentalRow.is_paid,
            datePaid: rentalRow.date_paid
              ? rentalRow.date_paid.substring(0, 10)
              : undefined,
            notes: rentalRow.notes || undefined,
            createdAt: rentalRow.created_at || new Date().toISOString(),
            updatedAt: rentalRow.updated_at || new Date().toISOString(),
          };

          set((state) => ({ rentals: [...state.rentals, newRental] }));

          rentalsDataService.invalidateCache(rentalRow.date);
          if (rentalRow.date_paid) {
            rentalsDataService.invalidateCache(rentalRow.date_paid);
          }
        } catch (err) {
          console.error('Failed to add rental to Supabase', err);
          throw err;
        }
      },

      updateRental: async (id, updates) => {
        try {
          const payload: RentalUpdate = {};
          const nowIso = new Date().toISOString();

          const currentRental = get().rentals.find((r) => r.id === id);
          if (!currentRental) {
            throw new Error('Alquiler no encontrado');
          }

          let splitWrite:
            | ReturnType<typeof preparePaymentWritePayload>
            | undefined;

          if (
            updates.paymentMethod !== undefined ||
            updates.paymentSplits !== undefined ||
            updates.totalUsd !== undefined
          ) {
            const totalUsd = updates.totalUsd ?? currentRental.totalUsd;
            splitWrite = buildRentalWriteContext(
              {
                paymentMethod:
                  updates.paymentMethod ?? currentRental.paymentMethod,
                paymentSplits:
                  updates.paymentSplits ?? currentRental.paymentSplits,
                totalUsd,
              },
              currentRental.paymentSplits?.find(
                (split) => split.exchangeRateUsed
              )?.exchangeRateUsed ?? 1
            );
          }

          if (updates.machineId !== undefined)
            payload.machine_id = updates.machineId;
          if (updates.shift !== undefined) payload.shift = updates.shift;
          if (updates.date !== undefined) payload.date = updates.date;
          if (updates.deliveryTime !== undefined)
            payload.delivery_time = updates.deliveryTime;
          if (updates.pickupTime !== undefined)
            payload.pickup_time = updates.pickupTime;
          if (updates.pickupDate !== undefined)
            payload.pickup_date = updates.pickupDate;
          if (updates.deliveryFee !== undefined)
            payload.delivery_fee = updates.deliveryFee;
          if (updates.totalUsd !== undefined)
            payload.total_usd = updates.totalUsd;
          if (updates.paymentMethod !== undefined)
            payload.payment_method =
              splitWrite?.paymentMethod ?? updates.paymentMethod;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
          if ('datePaid' in updates)
            payload.date_paid = updates.datePaid || null;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.customerId !== undefined)
            payload.customer_id = updates.customerId;

          const customerUpdates: CustomerUpdate = {};
          if (updates.customerName !== undefined)
            customerUpdates.name = updates.customerName;
          if (updates.customerPhone !== undefined)
            customerUpdates.phone = updates.customerPhone;
          if (updates.customerAddress !== undefined)
            customerUpdates.address = updates.customerAddress;

          payload.updated_at = nowIso;

          if (!window.navigator.onLine) {
            enqueueOfflineRentalUpdate({ id, payload });

            if (splitWrite) {
              enqueueOfflineRentalPaymentSplitsReplace(
                id,
                splitWrite.paymentSplits
              );
            }

            set((state) => ({
              rentals: state.rentals.map((rental) =>
                rental.id === id
                  ? {
                      ...rental,
                      ...updates,
                      paymentMethod:
                        splitWrite?.paymentMethod ??
                        updates.paymentMethod ??
                        rental.paymentMethod,
                      paymentSplits:
                        splitWrite?.paymentSplits ??
                        updates.paymentSplits ??
                        rental.paymentSplits,
                      updatedAt: nowIso,
                    }
                  : rental
              ),
            }));
            const updatedRental = get().rentals.find((r) => r.id === id);
            if (updatedRental) {
              rentalsDataService.invalidateCache(updatedRental.date);
              if (updatedRental.datePaid) {
                rentalsDataService.invalidateCache(updatedRental.datePaid);
              }
              if (updates.date && updates.date !== updatedRental.date) {
                rentalsDataService.invalidateCache(updates.date);
              }
              if (
                updates.datePaid &&
                updates.datePaid !== updatedRental.datePaid
              ) {
                rentalsDataService.invalidateCache(updates.datePaid);
              }
            }
            return;
          }

          if (Object.keys(customerUpdates).length > 0 && updates.customerId) {
            const { error: customerError } = await supabase
              .from('customers')
              .update(customerUpdates)
              .eq('id', updates.customerId);
            if (customerError) throw customerError;
          }

          const { error } = await supabase
            .from('washer_rentals')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          if (splitWrite) {
            await replaceRentalSplits(id, splitWrite.paymentSplits);
          }

          set((state) => ({
            rentals: state.rentals.map((rental) =>
              rental.id === id
                ? {
                    ...rental,
                    ...updates,
                    paymentMethod:
                      splitWrite?.paymentMethod ??
                      updates.paymentMethod ??
                      rental.paymentMethod,
                    paymentSplits:
                      splitWrite?.paymentSplits ??
                      updates.paymentSplits ??
                      rental.paymentSplits,
                    updatedAt: nowIso,
                  }
                : rental
            ),
          }));
          const updatedRental = get().rentals.find((r) => r.id === id);
          if (updatedRental) {
            rentalsDataService.invalidateCache(updatedRental.date);
            if (updatedRental.datePaid) {
              rentalsDataService.invalidateCache(updatedRental.datePaid);
            }
            if (updates.date && updates.date !== updatedRental.date) {
              rentalsDataService.invalidateCache(updates.date);
            }
            if (
              updates.datePaid &&
              updates.datePaid !== updatedRental.datePaid
            ) {
              rentalsDataService.invalidateCache(updates.datePaid);
            }
          }
        } catch (err) {
          console.error('Failed to update rental in Supabase', err);
          throw err;
        }
      },

      deleteRental: async (id) => {
        const rentalToDelete = get().rentals.find((r) => r.id === id);
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineRentalDelete({ id });
            enqueueOfflineRentalPaymentSplitsDelete(id);

            set((state) => ({
              rentals: state.rentals.filter((rental) => rental.id !== id),
            }));
            if (rentalToDelete) {
              rentalsDataService.invalidateCache(rentalToDelete.date);
              if (rentalToDelete.datePaid) {
                rentalsDataService.invalidateCache(rentalToDelete.datePaid);
              }
            }
            return;
          }

          const { error } = await supabase
            .from('washer_rentals')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            rentals: state.rentals.filter((rental) => rental.id !== id),
          }));
          if (rentalToDelete) {
            rentalsDataService.invalidateCache(rentalToDelete.date);
            if (rentalToDelete.datePaid) {
              rentalsDataService.invalidateCache(rentalToDelete.datePaid);
            }
          }
        } catch (err) {
          console.error('Failed to delete rental from Supabase', err);
          throw err;
        }
      },

      getRentalsByDate: (date) =>
        get().rentals.filter((rental) => rental.date === date),

      getActiveRentalsForDate: (date) =>
        get().rentals.filter(
          (rental) => rental.date === date && rental.status !== 'finalizado'
        ),

      // Cargas
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
