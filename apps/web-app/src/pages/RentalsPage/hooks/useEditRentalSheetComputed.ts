import { useMemo } from 'react';
import { parse } from 'date-fns';
import { calculatePickupTime, formatPickupInfo } from '@/utils/rentalSchedule';
import { calculateShiftBasePrice } from '@/utils/rentalPricing';
import {
  resolveEditedRentalShift,
  type RentalShiftCatalog,
} from '@/utils/shiftCatalog';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { calculateFinalRentalTotals } from '@/services/transactions/transactionTotals';
import { getUnavailableMachineIds } from './editRentalSheetViewModel.helpers';
import type { WasherRental } from '@/types';
import type {
  PaymentMethod,
  PaymentSplit,
  RentalShift,
} from '@aqua-guest/domain';

interface Params {
  rental: WasherRental | null;
  shift: RentalShift;
  shiftCatalog: RentalShiftCatalog;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  deliveryTime: string;
  split2Method: PaymentMethod;
  split1Amount: string;
  hasMixedPaymentEnabled: boolean;
  tipAmountBs: number;
  exchangeRate: number;
  rentals: WasherRental[];
}

export function useEditRentalSheetComputed(params: Params) {
  const shiftDefinition = useMemo(
    () =>
      resolveEditedRentalShift(
        params.rental,
        params.shift,
        params.shiftCatalog
      ),
    [params.rental, params.shift, params.shiftCatalog]
  );

  const pickupInfo = useMemo(() => {
    if (!params.rental) return { pickupDate: '', pickupTime: '' };
    const date = parse(params.rental.date, 'yyyy-MM-dd', new Date());
    return calculatePickupTime(date, params.deliveryTime, shiftDefinition);
  }, [params.rental, params.deliveryTime, shiftDefinition]);

  const subtotalUsd = useMemo(
    () =>
      calculateShiftBasePrice(shiftDefinition, params.paymentMethod) +
      params.deliveryFee,
    [shiftDefinition, params.paymentMethod, params.deliveryFee]
  );

  const totalUsd = useMemo(
    () =>
      calculateFinalRentalTotals({
        principalUsd: subtotalUsd,
        tipAmountBs: params.tipAmountBs,
        exchangeRate: params.exchangeRate,
      }).totalUsd,
    [subtotalUsd, params.tipAmountBs, params.exchangeRate]
  );

  const totalBs = useMemo(
    () => totalUsd * params.exchangeRate,
    [totalUsd, params.exchangeRate]
  );

  const subtotalBs = useMemo(
    () => (params.exchangeRate > 0 ? subtotalUsd * params.exchangeRate : 0),
    [subtotalUsd, params.exchangeRate]
  );

  const paymentSplits = useMemo<PaymentSplit[]>(
    () =>
      buildDualPaymentSplits({
        enableMixedPayment: params.hasMixedPaymentEnabled,
        primaryMethod: params.paymentMethod,
        secondaryMethod: params.split2Method,
        amountInput: params.split1Amount,
        amountInputMode: 'secondary',
        totalBs: subtotalBs,
        totalUsd: subtotalUsd,
        exchangeRate: params.exchangeRate,
      }),
    [
      params.hasMixedPaymentEnabled,
      params.paymentMethod,
      params.split2Method,
      params.split1Amount,
      params.exchangeRate,
      subtotalBs,
      subtotalUsd,
    ]
  );

  const unavailableMachines = useMemo(() => {
    if (!params.rental) return [] as string[];
    return getUnavailableMachineIds({
      rentals: params.rentals,
      currentRentalId: params.rental.id,
      currentDate: params.rental.date,
      deliveryTime: params.deliveryTime,
      pickupDate: pickupInfo.pickupDate,
      pickupTime: pickupInfo.pickupTime,
    });
  }, [
    params.rentals,
    params.rental,
    params.deliveryTime,
    pickupInfo.pickupDate,
    pickupInfo.pickupTime,
  ]);

  const pickupLabel = useMemo(() => {
    if (!params.rental) return '';
    return formatPickupInfo(
      pickupInfo.pickupDate,
      pickupInfo.pickupTime,
      params.rental.date
    );
  }, [pickupInfo.pickupDate, pickupInfo.pickupTime, params.rental]);

  return {
    pickupInfo,
    pickupLabel,
    subtotalUsd,
    subtotalBs,
    totalUsd,
    totalBs,
    paymentSplits,
    unavailableMachines,
  };
}
