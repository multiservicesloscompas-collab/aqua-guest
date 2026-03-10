/**
 * useRentalStore.actions.ts
 * Extracted async action implementations for the rental Zustand store.
 * Each function accepts Zustand's set/get so they can be used inside create().
 */
import supabase from '@/lib/supabaseClient';
import { WasherRental } from '@/types';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import { rentalsDataService } from '@/services/RentalsDataService';
import {
  enqueueOfflineRental,
  enqueueOfflineRentalDelete,
  enqueueOfflineRentalPaymentSplitsDelete,
  enqueueOfflineRentalPaymentSplitsReplace,
  enqueueOfflineRentalUpdate,
} from '@/offline/enqueue/rentalsEnqueue';
import { useCustomerStore } from './useCustomerStore';
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

type SetFn = (
  partial: Partial<RentalState> | ((state: RentalState) => Partial<RentalState>)
) => void;
type GetFn = () => RentalState;

export async function addRentalAction(
  rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>,
  set: SetFn,
  _get: GetFn
): Promise<void> {
  try {
    let customerId = rental.customerId;

    if (!customerId) {
      if (!rental.customerName) {
        throw new Error('Nombre de cliente requerido para crear el alquiler');
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

    if (!customerId) throw new Error('Customer ID is required for rental');

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
        rental: { ...rental, customerId },
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
    if (!rentalRow) throw new Error('Error al crear el alquiler');

    await replaceRentalSplits(rentalRow.id, splitWrite.paymentSplits);
    const normalizedSplits = await fetchRentalSplits(rentalRow.id);
    const newRental = mapRentalRowToWasherRental(
      rentalRow,
      normalizedSplits,
      splitWrite.paymentMethod,
      rental
    );

    set((state) => ({ rentals: [...state.rentals, newRental] }));
    rentalsDataService.invalidateCache(rentalRow.date);
    if (rentalRow.date_paid)
      rentalsDataService.invalidateCache(rentalRow.date_paid);
  } catch (err) {
    console.error('Failed to add rental to Supabase', err);
    throw err;
  }
}

export async function updateRentalAction(
  id: string,
  updates: Partial<WasherRental>,
  set: SetFn,
  get: GetFn
): Promise<void> {
  try {
    const payload: RentalUpdate = {};
    const nowIso = new Date().toISOString();
    const currentRental = get().rentals.find((r) => r.id === id);
    if (!currentRental) throw new Error('Alquiler no encontrado');

    let splitWrite: ReturnType<typeof preparePaymentWritePayload> | undefined;
    if (
      updates.paymentMethod !== undefined ||
      updates.paymentSplits !== undefined ||
      updates.totalUsd !== undefined
    ) {
      const totalUsd = updates.totalUsd ?? currentRental.totalUsd;
      splitWrite = buildRentalWriteContext(
        {
          paymentMethod: updates.paymentMethod ?? currentRental.paymentMethod,
          paymentSplits: updates.paymentSplits ?? currentRental.paymentSplits,
          totalUsd,
        },
        currentRental.paymentSplits?.find((s) => s.exchangeRateUsed)
          ?.exchangeRateUsed ?? 1
      );
    }

    if (updates.machineId !== undefined) payload.machine_id = updates.machineId;
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
    if (updates.totalUsd !== undefined) payload.total_usd = updates.totalUsd;
    if (updates.paymentMethod !== undefined)
      payload.payment_method =
        splitWrite?.paymentMethod ?? updates.paymentMethod;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
    if ('datePaid' in updates) payload.date_paid = updates.datePaid || null;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.customerId !== undefined)
      payload.customer_id = updates.customerId;
    payload.updated_at = nowIso;

    const customerUpdates: CustomerUpdate = {};
    if (updates.customerName !== undefined)
      customerUpdates.name = updates.customerName;
    if (updates.customerPhone !== undefined)
      customerUpdates.phone = updates.customerPhone;
    if (updates.customerAddress !== undefined)
      customerUpdates.address = updates.customerAddress;

    const applyLocal = () => {
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
    };
    const invalidate = () => {
      const r = get().rentals.find((r) => r.id === id);
      if (!r) return;
      rentalsDataService.invalidateCache(r.date);
      if (r.datePaid) rentalsDataService.invalidateCache(r.datePaid);
      if (updates.date && updates.date !== r.date)
        rentalsDataService.invalidateCache(updates.date);
      if (updates.datePaid && updates.datePaid !== r.datePaid)
        rentalsDataService.invalidateCache(updates.datePaid);
    };

    if (!window.navigator.onLine) {
      enqueueOfflineRentalUpdate({ id, payload });
      if (splitWrite)
        enqueueOfflineRentalPaymentSplitsReplace(id, splitWrite.paymentSplits);
      applyLocal();
      invalidate();
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
    if (splitWrite) await replaceRentalSplits(id, splitWrite.paymentSplits);
    applyLocal();
    invalidate();
  } catch (err) {
    console.error('Failed to update rental in Supabase', err);
    throw err;
  }
}

export async function deleteRentalAction(
  id: string,
  set: SetFn,
  get: GetFn
): Promise<void> {
  const rentalToDelete = get().rentals.find((r) => r.id === id);
  try {
    if (!window.navigator.onLine) {
      enqueueOfflineRentalDelete({ id });
      enqueueOfflineRentalPaymentSplitsDelete(id);
      set((state) => ({ rentals: state.rentals.filter((r) => r.id !== id) }));
      if (rentalToDelete) {
        rentalsDataService.invalidateCache(rentalToDelete.date);
        if (rentalToDelete.datePaid)
          rentalsDataService.invalidateCache(rentalToDelete.datePaid);
      }
      return;
    }
    const { error } = await supabase
      .from('washer_rentals')
      .delete()
      .eq('id', id);
    if (error) throw error;
    set((state) => ({ rentals: state.rentals.filter((r) => r.id !== id) }));
    if (rentalToDelete) {
      rentalsDataService.invalidateCache(rentalToDelete.date);
      if (rentalToDelete.datePaid)
        rentalsDataService.invalidateCache(rentalToDelete.datePaid);
    }
  } catch (err) {
    console.error('Failed to delete rental from Supabase', err);
    throw err;
  }
}
