import supabase from '@/lib/supabaseClient';
import type { WasherRental } from '@/types';
import type { TipCaptureInput } from '@/types/tips';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import {
  enqueueOfflineRentalPaymentSplitsReplace,
  enqueueOfflineRentalUpdate,
} from '@/offline/enqueue/rentalsEnqueue';
import { rentalsDataService } from '@/services/RentalsDataService';
import {
  calculateFinalRentalTotals,
  mergeTipIntoPaymentSplits,
} from '@/services/transactions/transactionTotals';
import { replaceRentalSplits } from './useRentalStore.supabase';
import {
  type CustomerUpdate,
  type RentalState,
  type RentalUpdate,
  buildRentalWriteContext,
} from './useRentalStore.core';

type SetFn = (
  partial: Partial<RentalState> | ((state: RentalState) => Partial<RentalState>)
) => void;
type GetFn = () => RentalState;

export async function updateRentalAction(
  id: string,
  updates: Partial<WasherRental>,
  tipInput: TipCaptureInput | null | undefined,
  set: SetFn,
  get: GetFn
): Promise<void> {
  try {
    const payload: RentalUpdate = {};
    const nowIso = new Date().toISOString();
    const currentRental = get().rentals.find((r) => r.id === id);
    if (!currentRental) throw new Error('Alquiler no encontrado');

    const effectiveUpdates: Partial<WasherRental> = { ...updates };

    if (tipInput && tipInput.amountBs > 0) {
      const exchangeRate =
        (updates.paymentSplits ?? currentRental.paymentSplits)?.find(
          (split) => split.exchangeRateUsed
        )?.exchangeRateUsed ?? 1;

      // Ensure we have the correct principal amount to add the tip to
      const principalUsd = updates.totalUsd ?? currentRental.totalUsd;

      const finalTotals = calculateFinalRentalTotals({
        principalUsd,
        tipAmountBs: tipInput.amountBs,
        exchangeRate,
      });

      effectiveUpdates.totalUsd = finalTotals.totalUsd;

      // Merge tip into payment splits
      effectiveUpdates.paymentSplits = mergeTipIntoPaymentSplits({
        paymentSplits: updates.paymentSplits ?? currentRental.paymentSplits,
        fallbackMethod:
          updates.paymentMethod ?? currentRental.paymentMethod ?? 'efectivo',
        tipAmountBs: tipInput.amountBs,
        tipPaymentMethod: tipInput.capturePaymentMethod,
        exchangeRate,
        principalUsd, // Pass principal amount in USD
      });
    }

    let splitWrite: ReturnType<typeof preparePaymentWritePayload> | undefined;
    if (
      effectiveUpdates.paymentMethod !== undefined ||
      effectiveUpdates.paymentSplits !== undefined ||
      effectiveUpdates.totalUsd !== undefined
    ) {
      const totalUsd = effectiveUpdates.totalUsd ?? currentRental.totalUsd;
      splitWrite = buildRentalWriteContext(
        {
          paymentMethod:
            effectiveUpdates.paymentMethod ?? currentRental.paymentMethod,
          paymentSplits:
            effectiveUpdates.paymentSplits ?? currentRental.paymentSplits,
          totalUsd,
        },
        currentRental.paymentSplits?.find((s) => s.exchangeRateUsed)
          ?.exchangeRateUsed ?? 1
      );
    }

    if (effectiveUpdates.machineId !== undefined)
      payload.machine_id = effectiveUpdates.machineId;
    if (effectiveUpdates.shift !== undefined)
      payload.shift = effectiveUpdates.shift;
    if (effectiveUpdates.date !== undefined)
      payload.date = effectiveUpdates.date;
    if (effectiveUpdates.deliveryTime !== undefined)
      payload.delivery_time = effectiveUpdates.deliveryTime;
    if (effectiveUpdates.pickupTime !== undefined)
      payload.pickup_time = effectiveUpdates.pickupTime;
    if (effectiveUpdates.pickupDate !== undefined)
      payload.pickup_date = effectiveUpdates.pickupDate;
    if (effectiveUpdates.deliveryFee !== undefined)
      payload.delivery_fee = effectiveUpdates.deliveryFee;
    if (effectiveUpdates.totalUsd !== undefined)
      payload.total_usd = effectiveUpdates.totalUsd;
    if (effectiveUpdates.paymentMethod !== undefined)
      payload.payment_method =
        splitWrite?.paymentMethod ?? effectiveUpdates.paymentMethod;
    if (effectiveUpdates.status !== undefined)
      payload.status = effectiveUpdates.status;
    if (effectiveUpdates.isPaid !== undefined)
      payload.is_paid = effectiveUpdates.isPaid;
    if ('datePaid' in effectiveUpdates)
      payload.date_paid = effectiveUpdates.datePaid || null;
    if (effectiveUpdates.notes !== undefined)
      payload.notes = effectiveUpdates.notes;
    if (effectiveUpdates.customerId !== undefined)
      payload.customer_id = effectiveUpdates.customerId;
    payload.updated_at = nowIso;

    const customerUpdates: CustomerUpdate = {};
    if (effectiveUpdates.customerName !== undefined)
      customerUpdates.name = effectiveUpdates.customerName;
    if (effectiveUpdates.customerPhone !== undefined)
      customerUpdates.phone = effectiveUpdates.customerPhone;
    if (effectiveUpdates.customerAddress !== undefined)
      customerUpdates.address = effectiveUpdates.customerAddress;

    const applyLocal = () => {
      set((state) => ({
        rentals: state.rentals.map((rental) =>
          rental.id === id
            ? {
                ...rental,
                ...effectiveUpdates,
                paymentMethod:
                  splitWrite?.paymentMethod ??
                  effectiveUpdates.paymentMethod ??
                  rental.paymentMethod,
                paymentSplits:
                  splitWrite?.paymentSplits ??
                  effectiveUpdates.paymentSplits ??
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
      if (effectiveUpdates.date && effectiveUpdates.date !== r.date)
        rentalsDataService.invalidateCache(effectiveUpdates.date);
      if (effectiveUpdates.datePaid && effectiveUpdates.datePaid !== r.datePaid)
        rentalsDataService.invalidateCache(effectiveUpdates.datePaid);
    };

    if (!window.navigator.onLine) {
      enqueueOfflineRentalUpdate({ id, payload });
      if (splitWrite)
        enqueueOfflineRentalPaymentSplitsReplace(id, splitWrite.paymentSplits);
      applyLocal();
      invalidate();
      return;
    }

    if (
      Object.keys(customerUpdates).length > 0 &&
      effectiveUpdates.customerId
    ) {
      const { error: customerError } = await supabase
        .from('customers')
        .update(customerUpdates)
        .eq('id', effectiveUpdates.customerId);
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
