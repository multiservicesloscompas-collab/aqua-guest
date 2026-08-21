import type {
  CustomerUpdate,
  WasherRentalUpdate,
} from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
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
import {
  type RentalState,
  buildRentalWriteContext,
} from './useRentalStore.core';

type SetFn = (
  partial: Partial<RentalState> | ((state: RentalState) => Partial<RentalState>)
) => void;
type GetFn = () => RentalState;

export async function updateRentalAction(
  id: string,
  updates: WasherRentalUpdate,
  tipInput: TipCaptureInput | null | undefined,
  set: SetFn,
  get: GetFn
): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    const currentRental = get().rentals.find((r) => r.id === id);
    if (!currentRental) throw new Error('Alquiler no encontrado');

    const effectiveUpdates: WasherRentalUpdate = { ...updates };

    if (tipInput && tipInput.amountBs > 0) {
      const exchangeRate =
        (updates.paymentSplits ?? currentRental.paymentSplits)?.find(
          (split) => split.exchangeRateUsed
        )?.exchangeRateUsed ?? 1;

      const principalUsd = updates.totalUsd ?? currentRental.totalUsd;

      const finalTotals = calculateFinalRentalTotals({
        principalUsd,
        tipAmountBs: tipInput.amountBs,
        exchangeRate,
      });

      effectiveUpdates.totalUsd = finalTotals.totalUsd;

      effectiveUpdates.paymentSplits = mergeTipIntoPaymentSplits({
        paymentSplits: updates.paymentSplits ?? currentRental.paymentSplits,
        fallbackMethod:
          updates.paymentMethod ?? currentRental.paymentMethod ?? 'efectivo',
        tipAmountBs: tipInput.amountBs,
        tipPaymentMethod: tipInput.capturePaymentMethod,
        exchangeRate,
        principalUsd,
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
      enqueueOfflineRentalUpdate({
        id,
        payload: {
          ...(effectiveUpdates.machineId !== undefined
            ? { machine_id: effectiveUpdates.machineId }
            : {}),
          ...(effectiveUpdates.shift !== undefined
            ? { shift: effectiveUpdates.shift }
            : {}),
          ...(effectiveUpdates.date !== undefined ? { date: effectiveUpdates.date } : {}),
          ...(effectiveUpdates.deliveryTime !== undefined
            ? { delivery_time: effectiveUpdates.deliveryTime }
            : {}),
          ...(effectiveUpdates.pickupTime !== undefined
            ? { pickup_time: effectiveUpdates.pickupTime }
            : {}),
          ...(effectiveUpdates.pickupDate !== undefined
            ? { pickup_date: effectiveUpdates.pickupDate }
            : {}),
          ...(effectiveUpdates.deliveryFee !== undefined
            ? { delivery_fee: effectiveUpdates.deliveryFee }
            : {}),
          ...(effectiveUpdates.totalUsd !== undefined
            ? { total_usd: effectiveUpdates.totalUsd }
            : {}),
          ...(effectiveUpdates.paymentMethod !== undefined
            ? {
                payment_method:
                  splitWrite?.paymentMethod ?? effectiveUpdates.paymentMethod,
              }
            : {}),
          ...(effectiveUpdates.status !== undefined
            ? { status: effectiveUpdates.status }
            : {}),
          ...(effectiveUpdates.isPaid !== undefined
            ? { is_paid: effectiveUpdates.isPaid }
            : {}),
          ...('datePaid' in effectiveUpdates
            ? { date_paid: effectiveUpdates.datePaid || null }
            : {}),
          ...(effectiveUpdates.notes !== undefined
            ? { notes: effectiveUpdates.notes }
            : {}),
          ...(effectiveUpdates.customerId !== undefined
            ? { customer_id: effectiveUpdates.customerId }
            : {}),
          updated_at: nowIso,
        },
      });
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
      await appRepositories.customersRepository.update(
        effectiveUpdates.customerId,
        customerUpdates
      );
    }

    await appRepositories.washerRentalsRepository.update(id, {
      ...effectiveUpdates,
      ...(splitWrite
        ? {
            paymentMethod: splitWrite.paymentMethod,
            paymentSplits: splitWrite.paymentSplits,
          }
        : {}),
    });
    applyLocal();
    invalidate();
  } catch (err) {
    console.error('Failed to update rental in Supabase', err);
    throw err;
  }
}
