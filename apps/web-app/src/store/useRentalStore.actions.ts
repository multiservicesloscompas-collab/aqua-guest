import type {
  WasherRental,
  WasherRentalDraft,
} from '@aqua-guest/domain/modules/washer-rentals';
import { appRepositories } from '@/lib/app-repositories';
import { rentalsDataService } from '@/services/RentalsDataService';
import {
  enqueueOfflineRental,
  enqueueOfflineRentalDelete,
  enqueueOfflineRentalPaymentSplitsDelete,
  enqueueOfflineRentalTipDelete,
} from '@/offline/enqueue/rentalsEnqueue';
import { useCustomerStore } from './useCustomerStore';
import { type RentalState, buildRentalWriteContext } from './useRentalStore.core';
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
  rental: WasherRentalDraft,
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
        const createdCustomer = await appRepositories.customersRepository.create({
          name: rental.customerName,
          phone: rental.customerPhone,
          address: rental.customerAddress,
        });
        customerId = createdCustomer.id;
        useCustomerStore.setState((state) => ({
          customers: [
            ...state.customers,
            {
              id: createdCustomer.id,
              name: createdCustomer.name,
              phone: createdCustomer.phone,
              address: createdCustomer.address,
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
        principalUsd: rental.totalUsd,
      }),
      totalUsd: finalTotals.totalUsd,
    });

    if (!window.navigator.onLine) {
      const offlineRental = enqueueOfflineRental({
        payload: {
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
        },
        rental: { ...rental, customerId, totalUsd: finalTotals.totalUsd },
        paymentSplits: splitWrite.paymentSplits,
      });
      set((state) => ({ rentals: [...state.rentals, offlineRental] }));
      return offlineRental;
    }

    const newRental = await appRepositories.washerRentalsRepository.create({
      ...rental,
      customerId,
      totalUsd: finalTotals.totalUsd,
      paymentMethod: splitWrite.paymentMethod,
      paymentSplits: splitWrite.paymentSplits,
    });

    set((state) => ({ rentals: [...state.rentals, newRental] }));
    rentalsDataService.invalidateCache(newRental.date);
    if (newRental.datePaid) rentalsDataService.invalidateCache(newRental.datePaid);
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

    await appRepositories.washerRentalsRepository.delete(id);
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
