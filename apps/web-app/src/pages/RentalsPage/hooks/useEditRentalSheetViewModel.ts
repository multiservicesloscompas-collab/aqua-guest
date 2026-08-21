import { useCallback, useMemo } from 'react';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useConfigStore } from '@/store/useConfigStore';
import { getVenezuelaDate } from '@/services/DateService';
import type { WasherRental } from '@/types';
import { useEditRentalFormState } from './useEditRentalFormState';
import {
  DELIVERY_FEE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  RENTAL_STATUS_OPTIONS,
  RENTAL_TIME_SLOTS,
  getPaidDateLabel,
  mapMachineItems,
  mapShiftOptions,
  resolveRentalSplitState,
} from './rentalSheetViewModel.helpers';
import { useEditRentalSheetComputed } from './useEditRentalSheetComputed';
import { useEditRentalTipHydration } from './useEditRentalTipHydration';
import { useEditRentalSubmission } from './useEditRentalSubmission';

interface EditRentalSheetViewModelProps {
  rental: WasherRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useEditRentalSheetViewModel({
  rental,
  open,
  onOpenChange,
}: EditRentalSheetViewModelProps) {
  const customers = useCustomerStore((state) => state.customers);
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('rentals')
  );
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const updateRental = useRentalStore((state) => state.updateRental);
  const rentals = useRentalStore((state) => state.rentals);
  const dynamicShifts = useRentalStore((state) => state.shifts);
  const washingMachines = useMachineStore((state) => state.washingMachines);

  const form = useEditRentalFormState({ rental, exchangeRate });

  useEditRentalTipHydration({
    open,
    rental,
    tipCapture: form.tipCapture,
    onTipHydrated: ({ amountBs, paymentMethod: tipMethod }) => {
      if (!rental) return;
      const splitState = resolveRentalSplitState(
        rental,
        exchangeRate,
        amountBs,
        tipMethod
      );
      form.applyTipPaymentHydration(splitState);
    },
  });

  const tipAmountBsNumeric = form.tipCapture.tipEnabled
    ? Number(form.tipCapture.tipAmount) || 0
    : 0;

  const hasMixedPaymentEnabled = isMixedPaymentEnabled && form.isMixedPayment;

  const computed = useEditRentalSheetComputed({
    rental,
    shift: form.shift,
    paymentMethod: form.paymentMethod,
    deliveryFee: form.deliveryFee,
    deliveryTime: form.deliveryTime,
    split2Method: form.split2Method,
    split1Amount: form.split1Amount,
    hasMixedPaymentEnabled,
    tipAmountBs: tipAmountBsNumeric,
    exchangeRate,
    rentals,
    dynamicShifts,
  });

  const machineItems = useMemo(
    () =>
      mapMachineItems({
        washingMachines,
        unavailableMachines: computed.unavailableMachines,
      }),
    [washingMachines, computed.unavailableMachines]
  );

  const shiftOptions = useMemo(
    () => mapShiftOptions(form.paymentMethod, dynamicShifts),
    [form.paymentMethod, dynamicShifts]
  );

  const paidDateLabel = useMemo(
    () => getPaidDateLabel(form.datePaid),
    [form.datePaid]
  );

  const { isLoading, handleSubmit } = useEditRentalSubmission({
    rentalId: rental?.id ?? '',
    form,
    computed,
    tipCapture: form.tipCapture,
    updateRental,
    onSuccess: () => onOpenChange(false),
  });

  const handleCustomerSelect = useCallback(
    (customerId: string | null) => {
      if (!customerId) {
        form.clearCustomer();
        return;
      }
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return;
      form.selectCustomer(customer);
    },
    [customers, form]
  );

  const handlePaymentStatusChange = useCallback(
    (value: 'paid' | 'pending') => {
      form.changePaymentStatus(value, getVenezuelaDate());
    },
    [form]
  );

  const handleToggleTip = useCallback(() => {
    form.tipCapture.onToggleTip(form.paymentMethod);
  }, [form.paymentMethod, form.tipCapture]);

  return {
    ...form,
    customers,
    machineItems,
    shiftOptions,
    paymentMethodOptions: PAYMENT_METHOD_OPTIONS,
    timeSlots: RENTAL_TIME_SLOTS,
    deliveryFeeOptions: DELIVERY_FEE_OPTIONS,
    pickupLabel: computed.pickupLabel,
    paidDateLabel,
    subtotalUsdText: computed.subtotalUsd.toFixed(2),
    tipAmountBs: tipAmountBsNumeric,
    totalUsdText: computed.totalUsd.toFixed(2),
    isLoading,
    selectedMachineId: form.machineId,
    selectedShift: form.shift,
    selectedPaymentMethod: form.paymentMethod,
    totalBs: computed.totalBs,
    split2Method: form.split2Method,
    split1Amount: form.split1Amount,
    isMixedPaymentEnabled,
    isMixedPayment: form.isMixedPayment,
    deliveryTime: form.deliveryTime,
    deliveryFee: form.deliveryFee,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerAddress: form.customerAddress,
    selectedCustomerId: form.selectedCustomerId || null,
    notes: form.notes,
    tipEnabled: form.tipCapture.tipEnabled,
    tipAmount: form.tipCapture.tipAmount,
    tipPaymentMethod: form.tipCapture.tipPaymentMethod,
    tipNotes: form.tipCapture.tipNotes,
    onSelectMachine: form.setMachineId,
    onSelectShift: form.setShift,
    onSelectPaymentMethod: form.selectPrimaryPaymentMethod,
    onSelectSplit2Method: form.selectSecondaryPaymentMethod,
    onChangeSplit1Amount: form.setSplit1Amount,
    onSelectDeliveryTime: form.setDeliveryTime,
    onSelectDeliveryFee: form.setDeliveryFee,
    onChangeCustomerName: form.setCustomerName,
    onChangeCustomerPhone: form.setCustomerPhone,
    onChangeCustomerAddress: form.setCustomerAddress,
    onChangeNotes: form.setNotes,
    onChangeStatus: form.setStatus,
    onChangeDatePaid: form.setDatePaid,
    onSelectCustomer: handleCustomerSelect,
    onToggleTip: handleToggleTip,
    onChangeTipAmount: form.tipCapture.onChangeTipAmount,
    onChangeTipPaymentMethod: form.tipCapture.onChangeTipPaymentMethod,
    onChangeTipNotes: form.tipCapture.onChangeTipNotes,
    onToggleMixedPayment: form.toggleMixedPayment,
    onChangePaymentStatus: handlePaymentStatusChange,
    onSubmit: handleSubmit,
    statusOptions: RENTAL_STATUS_OPTIONS,
  };
}
