import supabase from '@/lib/supabaseClient';
import { WasherRental } from '@/types';
import { rentalsDataService } from '@/services/RentalsDataService';
import {
  enqueueOfflineRental,
  enqueueOfflineRentalDelete,
  enqueueOfflineRentalPaymentSplitsDelete,
  enqueueOfflineRentalTipDelete,
} from '@/offline/enqueue/rentalsEnqueue';
import { useCustomerStore } from './useCustomerStore';
import {
  type RentalState,
  type RentalRow,
  type RentalInsert,
  buildRentalWriteContext,
  mapRentalRowToWasherRental,
} from './useRentalStore.core';
import {
  replaceRentalSplits,
  fetchRentalSplits,
} from './useRentalStore.supabase';
import { useTipStore } from './useTipStore';
import type { TipCaptureInput } from '@/types/tips';
import {
  calculateFinalRentalTotals,
  mergeTipIntoPaymentSplits,
} from '@/services/transactions/transactionTotals';
export { updateRentalAction } from './useRentalStore.actions.update';

type SetFn = (
  partial: Partial<RentalState> | ((state: RentalState) => Partial<RentalState>)
) => void;
type GetFn = () => RentalState;

export async function addRentalAction(
  rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>,
  tipInput: TipCaptureInput | undefined,
  set: SetFn,
  _get: GetFn
): Promise<WasherRental> {
  try {
    let customerId = rental.customerId;

    if (!customerId) {
      if (!rental.customerName) {
        throw new Error('Nombre de cliente requerido para crear el alquiler');
      }
      const customerState = useCustomerStore.getState();
      const normalizedCustomerName = rental.customerName.toLowerCase();
      const existingCustomer = customerState.customers.find(
        (c) => c.name.toLowerCase() === normalizedCustomerName
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

    const exchangeRate =
      rental.paymentSplits?.find((split) => split.exchangeRateUsed)
        ?.exchangeRateUsed ?? 1;
    const finalTotals = calculateFinalRentalTotals({
      principalUsd: rental.totalUsd,
      tipAmountBs: tipInput?.amountBs,
      exchangeRate,
    });

    const splitWrite = buildRentalWriteContext({
      paymentMethod: rental.paymentMethod,
      paymentSplits: mergeTipIntoPaymentSplits({
        paymentSplits: rental.paymentSplits,
        fallbackMethod: rental.paymentMethod,
        tipAmountBs: tipInput?.amountBs ?? 0,
        tipPaymentMethod:
          tipInput?.capturePaymentMethod ?? rental.paymentMethod,
        exchangeRate,
        principalUsd: rental.totalUsd, // Pass principal amount
      }),
      totalUsd: finalTotals.totalUsd,
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
      total_usd: finalTotals.totalUsd,
      payment_method: splitWrite.paymentMethod,
      status: rental.status,
      is_paid: rental.isPaid,
      date_paid: rental.datePaid || null,
      notes: rental.notes || undefined,
    };

    if (!window.navigator.onLine) {
      const offlineRental = enqueueOfflineRental({
        payload,
        rental: { ...rental, customerId, totalUsd: finalTotals.totalUsd },
        paymentSplits: splitWrite.paymentSplits,
      });
      set((state) => ({ rentals: [...state.rentals, offlineRental] }));
      return offlineRental;
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
    return newRental;
  } catch (err) {
    console.error('Failed to add rental to Supabase', err);
    throw err;
  }
}

export async function deleteRentalAction(
  id: string,
  set: SetFn,
  get: GetFn,
  deleteTipByOrigin?: (originType: 'rental', originId: string) => Promise<void>
): Promise<void> {
  const rentalToDelete = get().rentals.find((r) => r.id === id);
  try {
    if (!window.navigator.onLine) {
      enqueueOfflineRentalDelete({ id });
      enqueueOfflineRentalPaymentSplitsDelete(id);
      enqueueOfflineRentalTipDelete(id);
      set((state) => ({ rentals: state.rentals.filter((r) => r.id !== id) }));
      if (rentalToDelete) {
        rentalsDataService.invalidateCache(rentalToDelete.date);
        if (rentalToDelete.datePaid)
          rentalsDataService.invalidateCache(rentalToDelete.datePaid);
      }
      return;
    }

    if (deleteTipByOrigin) {
      await deleteTipByOrigin('rental', id);
      useTipStore.getState().removeTipByOrigin('rental', id);
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
