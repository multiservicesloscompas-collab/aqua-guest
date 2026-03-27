import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useConfigStore } from '@/store/useConfigStore';
import { getVenezuelaDate } from '@/services/DateService';
import { generateTimeSlots } from '@/utils/rentalSchedule';
import { RentalStatus, RentalStatusLabels, WasherRental } from '@/types';
import { useEditRentalFormState } from './useEditRentalFormState';
import {
  getEditRentalValidationError,
  notifyEditRentalValidationError,
  submitEditRental,
} from './editRentalSheetViewModel.submit';
import {
  DELIVERY_FEE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  getPaidDateLabel,
  mapMachineItems,
  mapShiftOptions,
} from './editRentalSheetViewModel.helpers';
import { useEditRentalSheetComputed } from './useEditRentalSheetComputed';
import { useEditRentalTipHydration } from './useEditRentalTipHydration';

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
  const { customers } = useCustomerStore();
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('rentals')
  );
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const { updateRental, rentals } = useRentalStore();
  const { washingMachines } = useMachineStore();
  const form = useEditRentalFormState({ rental, exchangeRate });

  const {
    machineId,
    shift,
    deliveryTime,
    deliveryFee,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentMethod,
    split2Method,
    setSplit2Method,
    split1Amount,
    setSplit1Amount,
    isMixedPayment,
    setIsMixedPayment,
    notes,
    status,
    isPaid,
    setIsPaid,
    datePaid,
    setDatePaid,
    tipCapture,
  } = form;

  const [isLoading, setIsLoading] = useState(false);

  useEditRentalTipHydration({
    open,
    rental,
    tipCapture,
  });

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const tipAmountBsNumeric = useMemo(
    () => (tipCapture.tipEnabled ? Number(tipCapture.tipAmount) || 0 : 0),
    [tipCapture.tipAmount, tipCapture.tipEnabled]
  );

  const hasMixedPaymentEnabled = isMixedPaymentEnabled && isMixedPayment;
  const {
    pickupInfo,
    pickupLabel,
    subtotalUsd,
    subtotalBs,
    totalUsd,
    totalBs,
    paymentSplits,
    unavailableMachines,
  } = useEditRentalSheetComputed({
    rental,
    shift,
    paymentMethod,
    deliveryFee,
    deliveryTime,
    split2Method,
    split1Amount,
    hasMixedPaymentEnabled,
    tipAmountBs: tipAmountBsNumeric,
    exchangeRate,
    rentals,
  });

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, setSplit2Method, split2Method]);

  const machineItems = useMemo(
    () =>
      mapMachineItems({
        washingMachines,
        unavailableMachineIds: unavailableMachines,
      }),
    [washingMachines, unavailableMachines]
  );

  const shiftOptions = useMemo(
    () => mapShiftOptions(paymentMethod),
    [paymentMethod]
  );

  const paymentMethodOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, []);

  const paidDateLabel = useMemo(() => getPaidDateLabel(datePaid), [datePaid]);

  const handleCustomerSelect = (customerId: string | null) => {
    if (!customerId) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setSelectedCustomerId(customerId);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address);
  };

  const handleSubmit = async () => {
    if (!rental) return;

    const validationError = getEditRentalValidationError({
      machineId,
      customerName,
      customerAddress,
      unavailableMachines,
    });
    if (validationError) {
      notifyEditRentalValidationError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const tipInput = tipCapture.buildTipInput();
      
      // We pass the Principal Splits and Subtotal to submitEditRental.
      // The store (updateRentalAction) will handle merging the tip.
      await submitEditRental({
        rentalId: rental.id,
        paymentSplits: paymentSplits, // Principal splits
        totalBs: subtotalBs,          // Subtotal Bs (principal)
        totalUsd: subtotalUsd,        // Subtotal Usd (principal)
        updates: {
          machineId,
          shift,
          deliveryTime,
          pickupTime: pickupInfo.pickupTime,
          pickupDate: pickupInfo.pickupDate,
          deliveryFee,
          totalUsd: subtotalUsd,      // Principal Usd
          paymentMethod,
          paymentSplits: paymentSplits,
          selectedCustomerId,
          customerName,
          customerPhone,
          customerAddress,
          notes,
          status,
          isPaid,
          datePaid,
        },
        tipInput: tipCapture.tipEnabled ? tipInput : null,
        updateRental,
        onSuccess: () => onOpenChange(false),
      });
    } catch (error: unknown) {
      console.error('Error al actualizar el alquiler:', error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'Error al actualizar el alquiler');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...form,
    customers,
    machineItems,
    shiftOptions,
    paymentMethodOptions,
    timeSlots,
    deliveryFeeOptions: DELIVERY_FEE_OPTIONS,
    pickupLabel,
    paidDateLabel,
    subtotalUsdText: subtotalUsd.toFixed(2),
    tipAmountBs: tipAmountBsNumeric,
    totalUsdText: totalUsd.toFixed(2),
    isLoading,
    selectedMachineId: machineId,
    selectedShift: shift,
    selectedPaymentMethod: paymentMethod,
    totalBs,
    split2Method,
    split1Amount,
    isMixedPaymentEnabled,
    isMixedPayment,
    deliveryTime,
    deliveryFee,
    customerName,
    customerPhone,
    customerAddress,
    selectedCustomerId: selectedCustomerId || null,
    notes,
    tipEnabled: tipCapture.tipEnabled,
    tipAmount: tipCapture.tipAmount,
    tipPaymentMethod: tipCapture.tipPaymentMethod,
    tipNotes: tipCapture.tipNotes,
    onSelectMachine: form.setMachineId,
    onSelectShift: form.setShift,
    onSelectPaymentMethod: form.setPaymentMethod,
    onSelectSplit2Method: setSplit2Method,
    onChangeSplit1Amount: setSplit1Amount,
    onSelectDeliveryTime: form.setDeliveryTime,
    onSelectDeliveryFee: form.setDeliveryFee,
    onChangeCustomerName: setCustomerName,
    onChangeCustomerPhone: setCustomerPhone,
    onChangeCustomerAddress: setCustomerAddress,
    onChangeNotes: form.setNotes,
    onChangeStatus: form.setStatus,
    onChangeDatePaid: setDatePaid,
    onSelectCustomer: handleCustomerSelect,
    onToggleTip: () => tipCapture.onToggleTip(paymentMethod),
    onChangeTipAmount: tipCapture.onChangeTipAmount,
    onChangeTipPaymentMethod: tipCapture.onChangeTipPaymentMethod,
    onChangeTipNotes: tipCapture.onChangeTipNotes,
    onToggleMixedPayment: () =>
      setIsMixedPayment((current) => {
        const next = !current;
        if (!next) setSplit1Amount('');
        return next;
      }),
    onChangePaymentStatus: (value: 'paid' | 'pending') => {
      const paid = value === 'paid';
      setIsPaid(paid);
      if (paid && !datePaid) setDatePaid(getVenezuelaDate());
    },
    onSubmit: handleSubmit,
    statusOptions: Object.entries(RentalStatusLabels).map(([key, label]) => ({
      value: key as RentalStatus,
      label,
    })),
  };
}
