import { useCallback, useState } from 'react';
import type {
  PaymentMethod,
  RentalShift,
  RentalStatus,
  WasherRental,
} from '@/types';
import { SHIFT_UUID } from '@aqua-guest/domain';
import { resolveRentalSplitState } from './rentalSheetViewModel.helpers';
import { useTipCaptureState } from './useTipCaptureState';

export interface CustomerSelection {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface UseEditRentalFormStateParams {
  rental: WasherRental | null;
  exchangeRate: number;
}

function resolveAlternativeMethod(method: PaymentMethod): PaymentMethod {
  return method === 'efectivo' ? 'pago_movil' : 'efectivo';
}

function createInitialEditRentalFormState(
  rental: WasherRental | null,
  exchangeRate: number
) {
  if (!rental) {
    return {
      machineId: '',
      shift: SHIFT_UUID.completo as RentalShift,
      deliveryTime: '09:00',
      deliveryFee: 0,
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      selectedCustomerId: '',
      paymentMethod: 'pago_movil' as PaymentMethod,
      split2Method: 'efectivo' as PaymentMethod,
      split1Amount: '',
      isMixedPayment: false,
      notes: '',
      status: 'agendado' as RentalStatus,
      isPaid: false,
      datePaid: '',
    };
  }

  const splitState = resolveRentalSplitState(rental, exchangeRate);

  return {
    machineId: rental.machineId,
    shift: rental.shift,
    deliveryTime: rental.deliveryTime.substring(0, 5),
    deliveryFee: rental.deliveryFee,
    customerName: rental.customerName,
    customerPhone: rental.customerPhone,
    customerAddress: rental.customerAddress,
    selectedCustomerId: rental.customerId || '',
    paymentMethod: splitState.paymentMethod || 'efectivo',
    split2Method: splitState.split2Method,
    split1Amount: splitState.split1Amount,
    isMixedPayment: splitState.isMixedPayment,
    notes: rental.notes || '',
    status: rental.status,
    isPaid: rental.isPaid,
    datePaid: rental.datePaid || '',
  };
}

export function useEditRentalFormState({
  rental,
  exchangeRate,
}: UseEditRentalFormStateParams) {
  const [initialState] = useState(() =>
    createInitialEditRentalFormState(rental, exchangeRate)
  );

  const [machineId, setMachineId] = useState(initialState.machineId);
  const [shift, setShift] = useState<RentalShift>(initialState.shift);
  const [deliveryTime, setDeliveryTime] = useState(initialState.deliveryTime);
  const [deliveryFee, setDeliveryFee] = useState(initialState.deliveryFee);
  const [customerName, setCustomerName] = useState(initialState.customerName);
  const [customerPhone, setCustomerPhone] = useState(initialState.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(
    initialState.customerAddress
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialState.selectedCustomerId
  );
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>(
    initialState.paymentMethod
  );
  const [split2Method, setSplit2MethodState] = useState<PaymentMethod>(
    initialState.split2Method
  );
  const [split1Amount, setSplit1Amount] = useState(initialState.split1Amount);
  const [isMixedPayment, setIsMixedPayment] = useState(
    initialState.isMixedPayment
  );
  const [notes, setNotes] = useState(initialState.notes);
  const [status, setStatus] = useState<RentalStatus>(initialState.status);
  const [isPaid, setIsPaid] = useState(initialState.isPaid);
  const [datePaid, setDatePaid] = useState(initialState.datePaid);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const tipCapture = useTipCaptureState();

  const selectPrimaryPaymentMethod = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethodState(method);
      setSplit2MethodState((currentSecondary) =>
        currentSecondary === method
          ? resolveAlternativeMethod(method)
          : currentSecondary
      );
    },
    []
  );

  const selectSecondaryPaymentMethod = useCallback(
    (method: PaymentMethod) => {
      setSplit2MethodState(() => {
        if (paymentMethod === method) {
          return resolveAlternativeMethod(method);
        }
        return method;
      });
    },
    [paymentMethod]
  );

  const toggleMixedPayment = useCallback(() => {
    setIsMixedPayment((current) => {
      const next = !current;
      if (!next) {
        setSplit1Amount('');
      }
      return next;
    });
  }, []);

  const selectCustomer = useCallback((customer: CustomerSelection | null) => {
    if (!customer) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }

    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address);
  }, []);

  const clearCustomer = useCallback(() => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  }, []);

  const changePaymentStatus = useCallback(
    (nextStatus: 'paid' | 'pending', defaultDate?: string) => {
      const paid = nextStatus === 'paid';
      setIsPaid(paid);
      if (paid && defaultDate) {
        setDatePaid((currentDate) => currentDate || defaultDate);
      }
    },
    []
  );

  const applyTipPaymentHydration = useCallback(
    (splitState: {
      paymentMethod?: PaymentMethod;
      split1Amount: string;
      split2Method: PaymentMethod;
      isMixedPayment: boolean;
    }) => {
      setPaymentMethodState(splitState.paymentMethod || 'efectivo');
      setSplit1Amount(splitState.split1Amount);
      setSplit2MethodState(splitState.split2Method);
      setIsMixedPayment(splitState.isMixedPayment);
    },
    []
  );

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
    setPaymentMethod: selectPrimaryPaymentMethod,
    selectPrimaryPaymentMethod,
    split2Method,
    setSplit2Method: selectSecondaryPaymentMethod,
    selectSecondaryPaymentMethod,
    split1Amount,
    setSplit1Amount,
    isMixedPayment,
    setIsMixedPayment,
    toggleMixedPayment,
    notes,
    setNotes,
    status,
    setStatus,
    isPaid,
    setIsPaid,
    datePaid,
    setDatePaid,
    changePaymentStatus,
    isCalendarOpen,
    setIsCalendarOpen,
    selectCustomer,
    clearCustomer,
    applyTipPaymentHydration,
    tipCapture,
  };
}
