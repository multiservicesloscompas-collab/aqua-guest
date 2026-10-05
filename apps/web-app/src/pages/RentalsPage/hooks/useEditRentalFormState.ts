import { useEffect, useRef, useState } from 'react';
import { DEFAULT_RENTAL_SHIFT } from '@aqua-guest/domain';
import type {
  PaymentMethod,
  RentalShift,
  RentalStatus,
  WasherRental,
} from '@/types';
import { resolveRentalSplitState } from './editRentalSheetViewModel.helpers';
import { useTipCaptureState } from './useTipCaptureState';

interface UseEditRentalFormStateParams {
  rental: WasherRental | null;
  exchangeRate: number;
}

export function useEditRentalFormState({
  rental,
  exchangeRate,
}: UseEditRentalFormStateParams) {
  const [machineId, setMachineId] = useState('');
  const [shift, setShift] = useState<RentalShift>(DEFAULT_RENTAL_SHIFT);
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('efectivo');
  const [split1Amount, setSplit1Amount] = useState('');
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RentalStatus>('agendado');
  const [isPaid, setIsPaid] = useState(false);
  const [datePaid, setDatePaid] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const tipCapture = useTipCaptureState();

  // The form loads from the rental when the sheet opens for it. The exchange
  // rate is only read, so a late rate update must not reset what the user typed (B2).
  const exchangeRateRef = useRef(exchangeRate);
  exchangeRateRef.current = exchangeRate;

  useEffect(() => {
    if (!rental) return;

    setMachineId(rental.machineId);
    setShift(rental.shift);
    setDeliveryTime(rental.deliveryTime.substring(0, 5));
    setDeliveryFee(rental.deliveryFee);
    setCustomerName(rental.customerName);
    setCustomerPhone(rental.customerPhone);
    setCustomerAddress(rental.customerAddress);
    setSelectedCustomerId(rental.customerId || '');
    const splitState = resolveRentalSplitState(rental, exchangeRateRef.current);
    setPaymentMethod(splitState.paymentMethod || 'efectivo');
    setSplit1Amount(splitState.split1Amount);
    setSplit2Method(splitState.split2Method);
    setIsMixedPayment(splitState.isMixedPayment);

    setNotes(rental.notes || '');
    setStatus(rental.status);
    setIsPaid(rental.isPaid);
    setDatePaid(rental.datePaid || '');
  }, [rental]);

  return {
    machineId,
    setMachineId,
    shift,
    setShift,
    deliveryTime,
    setDeliveryTime,
    deliveryFee,
    setDeliveryFee,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentMethod,
    setPaymentMethod,
    split2Method,
    setSplit2Method,
    split1Amount,
    setSplit1Amount,
    isMixedPayment,
    setIsMixedPayment,
    notes,
    setNotes,
    status,
    setStatus,
    isPaid,
    setIsPaid,
    datePaid,
    setDatePaid,
    isCalendarOpen,
    setIsCalendarOpen,
    tipCapture,
  };
}
