import { useState } from 'react';
import type { PaymentMethod, RentalShift } from '@/types';
import { getDefaultDeliveryTime } from './rentalSheetViewModel.helpers';

export function useRentalSheetFormState() {
  const [machineId, setMachineId] = useState('');
  const [shift, setShift] = useState<RentalShift>('completo');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('efectivo');
  const [split1Amount, setSplit1Amount] = useState('');
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipPaymentMethod, setTipPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [tipNotes, setTipNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [datePaid, setDatePaid] = useState('');

  const resetForm = () => {
    setMachineId('');
    setShift('completo');
    setDeliveryTime(getDefaultDeliveryTime());
    setDeliveryFee(0);
    setPaymentMethod('pago_movil');
    setSplit2Method('efectivo');
    setSplit1Amount('');
    setIsMixedPayment(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setNotes('');
    setTipEnabled(false);
    setTipAmount('');
    setTipPaymentMethod('pago_movil');
    setTipNotes('');
    setIsPaid(false);
    setDatePaid('');
  };

  return {
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
  };
}
