import { useMemo } from 'react';
import { parse } from 'date-fns';
import type { PaymentMethod, PaymentSplit, RentalShiftConfig } from '@aqua-guest/domain';
import {
  calculatePickupTime,
  formatPickupInfo,
} from '@/utils/rentalSchedule';
import { calculateRentalPrice } from '@/utils/rentalPricing';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { calculateFinalRentalTotals } from '@/services/transactions/transactionTotals';
import { getUnavailableMachineIds } from './rentalSheetViewModel.helpers';
import type { WasherRental } from '@/types';

interface RentalSheetComputedParams {
  selectedDate: string;
  deliveryTime: string;
  shift: string;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  tipEnabled: boolean;
  tipAmount: string;
  exchangeRate: number;
  isMixedPaymentEnabled: boolean;
  isMixedPayment: boolean;
  split2Method: PaymentMethod;
  split1Amount: string;
  rentals: WasherRental[];
  dynamicShifts?: ReadonlyArray<RentalShiftConfig>;
}

export function useRentalSheetComputed(params: RentalSheetComputedParams) {
  const pickupInfo = useMemo(() => {
    const date = parse(params.selectedDate, 'yyyy-MM-dd', new Date());
    return calculatePickupTime(date, params.deliveryTime, params.shift, {
      dynamicShifts: params.dynamicShifts,
    });
  }, [params.selectedDate, params.deliveryTime, params.shift, params.dynamicShifts]);

  const subtotalUsd = useMemo(
    () =>
      calculateRentalPrice(
        params.shift,
        params.paymentMethod,
        params.deliveryFee,
        {
          dynamicShifts: params.dynamicShifts,
        }
      ),
    [params.shift, params.paymentMethod, params.deliveryFee, params.dynamicShifts]
  );

  const tipAmountBsNumeric = useMemo(
    () => (params.tipEnabled ? Number(params.tipAmount) || 0 : 0),
    [params.tipEnabled, params.tipAmount]
  );

  const finalTotals = useMemo(
    () =>
      calculateFinalRentalTotals({
        principalUsd: subtotalUsd,
        tipAmountBs: tipAmountBsNumeric,
        exchangeRate: params.exchangeRate,
      }),
    [subtotalUsd, tipAmountBsNumeric, params.exchangeRate]
  );

  const totalUsd = finalTotals.totalUsd;
  const totalBs = totalUsd * params.exchangeRate;
  const hasMixedPaymentEnabled =
    params.isMixedPaymentEnabled && params.isMixedPayment;

  const subtotalBs =
    params.exchangeRate > 0 ? subtotalUsd * params.exchangeRate : Number.NaN;

  const paymentSplits = useMemo<PaymentSplit[]>(
    () =>
      buildDualPaymentSplits({
        enableMixedPayment: hasMixedPaymentEnabled,
        primaryMethod: params.paymentMethod,
        secondaryMethod: params.split2Method,
        amountInput: params.split1Amount,
        amountInputMode: 'secondary',
        totalBs: subtotalBs,
        totalUsd: subtotalUsd,
        exchangeRate: params.exchangeRate,
      }),
    [
      hasMixedPaymentEnabled,
      params.exchangeRate,
      params.paymentMethod,
      params.split1Amount,
      params.split2Method,
      subtotalBs,
      subtotalUsd,
    ]
  );

  const unavailableMachines = useMemo(
    () =>
      getUnavailableMachineIds({
        rentals: params.rentals,
        selectedDate: params.selectedDate,
        deliveryTime: params.deliveryTime,
        pickupDate: pickupInfo.pickupDate,
        pickupTime: pickupInfo.pickupTime,
      }),
    [
      params.rentals,
      params.selectedDate,
      params.deliveryTime,
      pickupInfo.pickupDate,
      pickupInfo.pickupTime,
    ]
  );

  const pickupLabel = useMemo(
    () =>
      formatPickupInfo(
        pickupInfo.pickupDate,
        pickupInfo.pickupTime,
        params.selectedDate
      ),
    [pickupInfo.pickupDate, pickupInfo.pickupTime, params.selectedDate]
  );

  return {
    pickupInfo,
    subtotalUsd,
    tipAmountBsNumeric,
    totalUsd,
    totalBs,
    subtotalBs,
    paymentSplits,
    unavailableMachines,
    pickupLabel,
  };
}
