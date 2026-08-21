import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useConfigStore } from '@/store/useConfigStore';
import { generateTimeSlots } from '@/utils/rentalSchedule';
import {
  DELIVERY_FEE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  getDefaultDeliveryTime,
  getPaidDateLabel,
  getRentalValidationError,
  mapMachineItems,
  mapShiftOptions,
} from './rentalSheetViewModel.helpers';
import { useRentalSheetFormState } from './useRentalSheetFormState';
import { useRentalSheetComputed } from './useRentalSheetComputed';
import {
  handleCreateNewRentalCustomer,
  handleRentalCustomerSelect,
  toggleRentalMixedPayment,
  toggleRentalTipCapture,
} from './rentalSheetViewModel.handlers';
import { buildRentalSheetViewModelReturn } from './rentalSheetViewModel.return';
import { executeRentalSubmit } from './rentalSheetViewModel.executeSubmit';

interface RentalSheetViewModelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useRentalSheetViewModel({
  open,
  onOpenChange,
}: RentalSheetViewModelProps) {
  const { selectedDate } = useAppStore();
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('rentals')
  );
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const { customers } = useCustomerStore();
  const { addRental, rentals, shifts: dynamicShifts } = useRentalStore();
  const { washingMachines } = useMachineStore();
  const form = useRentalSheetFormState();
  const {
    machineId,
    setMachineId,
    shift,
    setShift,
    deliveryTime,
    setDeliveryTime,
    deliveryFee,
    setDeliveryFee,
    paymentMethod,
    setPaymentMethod,
    split2Method,
    setSplit2Method,
    split1Amount,
    setSplit1Amount,
    isMixedPayment,
    setIsMixedPayment,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    selectedCustomerId,
    setSelectedCustomerId,
    notes,
    setNotes,
    tipEnabled,
    setTipEnabled,
    tipAmount,
    setTipAmount,
    tipPaymentMethod,
    setTipPaymentMethod,
    tipNotes,
    setTipNotes,
    isPaid,
    setIsPaid,
    datePaid,
    setDatePaid,
    resetForm,
  } = form;
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDeliveryTime(getDefaultDeliveryTime());
    }
  }, [open, setDeliveryTime]);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const {
    pickupInfo,
    subtotalUsd,
    tipAmountBsNumeric,
    totalUsd,
    totalBs,
    subtotalBs,
    paymentSplits,
    unavailableMachines,
    pickupLabel,
  } = useRentalSheetComputed({
    selectedDate,
    deliveryTime,
    shift,
    paymentMethod,
    deliveryFee,
    tipEnabled,
    tipAmount,
    exchangeRate,
    isMixedPaymentEnabled,
    isMixedPayment,
    split2Method,
    split1Amount,
    rentals,
    dynamicShifts,
  });

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, setSplit2Method, split2Method]);

  const machineItems = useMemo(
    () => mapMachineItems({ washingMachines, unavailableMachines }),
    [washingMachines, unavailableMachines]
  );

  const shiftOptions = useMemo(
    () => mapShiftOptions(paymentMethod, dynamicShifts),
    [paymentMethod, dynamicShifts]
  );
  const paymentMethodOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, []);

  const handleSubmit = () =>
    executeRentalSubmit({
      machineId,
      customerName,
      customerAddress,
      unavailableMachines,
      paymentSplits,
      paymentMethod,
      tipAmountBsNumeric,
      tipPaymentMethod,
      exchangeRate,
      totalBs: subtotalBs,
      totalUsd: subtotalUsd,
      selectedDate,
      selectedCustomerId,
      customerPhone,
      shift,
      deliveryTime,
      pickupInfo,
      deliveryFee,
      notes,
      tipEnabled,
      tipAmount,
      tipNotes,
      addRental,
      onOpenChange,
      resetForm,
      setIsSaving,
      getRentalValidationError,
      isPaid,
      datePaid,
    });

  return buildRentalSheetViewModelReturn({
    form: {
      machineId,
      shift,
      paymentMethod,
      split2Method,
      split1Amount,
      isMixedPayment,
      deliveryTime,
      deliveryFee,
      customerName,
      customerPhone,
      customerAddress,
      selectedCustomerId,
      notes,
      tipEnabled,
      tipAmount,
      tipPaymentMethod,
      tipNotes,
      isPaid,
      datePaid,
      setMachineId,
      setShift,
      setPaymentMethod,
      setSplit2Method,
      setSplit1Amount,
      setIsMixedPayment,
      setDeliveryTime,
      setDeliveryFee,
      setCustomerName,
      setCustomerPhone,
      setCustomerAddress,
      setNotes,
      setTipEnabled,
      setTipAmount,
      setTipPaymentMethod,
      setTipNotes,
      setIsPaid,
      setDatePaid,
    },
    customers,
    machineItems,
    shiftOptions,
    paymentMethodOptions,
    timeSlots,
    deliveryFeeOptions: DELIVERY_FEE_OPTIONS,
    pickupLabel,
    subtotalUsdText: subtotalUsd.toFixed(2),
    tipAmountBs: tipAmountBsNumeric,
    totalUsdText: totalUsd.toFixed(2),
    totalBs,
    subtotalBs,
    isMixedPaymentEnabled,
    isSaving,
    onToggleMixedPayment: () =>
      toggleRentalMixedPayment({ setIsMixedPayment, setSplit1Amount }),
    onSelectCustomer: (customerId: string | null) =>
      handleRentalCustomerSelect({
        customerId,
        customers,
        setSelectedCustomerId,
        setCustomerName,
        setCustomerPhone,
        setCustomerAddress,
      }),
    onCreateNewCustomer: () =>
      handleCreateNewRentalCustomer({
        setSelectedCustomerId,
        setCustomerName,
        setCustomerPhone,
        setCustomerAddress,
      }),
    onToggleTip: () =>
      toggleRentalTipCapture({
        setTipEnabled,
        setTipPaymentMethod,
        paymentMethod,
      }),
    onChangePaymentStatus: (value: 'paid' | 'pending') => {
      const paid = value === 'paid';
      setIsPaid(paid);
      if (paid && !datePaid) setDatePaid(selectedDate);
    },
    onChangeDatePaid: setDatePaid,
    isCalendarOpen,
    setIsCalendarOpen,
    paidDateLabel: useMemo(() => getPaidDateLabel(datePaid), [datePaid]),
    onSubmit: handleSubmit,
  });
}
