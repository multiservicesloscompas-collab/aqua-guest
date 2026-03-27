import type { PaymentMethod } from '@/types';
import type { Customer } from '@/types';
import type {
  MachineItem,
  PaymentMethodOption,
  ShiftOption,
} from './rentalSheetViewModel.helpers';

interface RentalSheetFormShape {
  machineId: string;
  shift: 'medio' | 'completo' | 'doble';
  paymentMethod: PaymentMethod;
  split2Method: PaymentMethod;
  split1Amount: string;
  isMixedPayment: boolean;
  deliveryTime: string;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedCustomerId: string;
  notes: string;
  tipEnabled: boolean;
  tipAmount: string;
  tipPaymentMethod: PaymentMethod;
  tipNotes: string;
  isPaid: boolean;
  datePaid: string;
  setMachineId: (value: string) => void;
  setShift: (value: 'medio' | 'completo' | 'doble') => void;
  setPaymentMethod: (value: PaymentMethod) => void;
  setSplit2Method: (value: PaymentMethod) => void;
  setSplit1Amount: (value: string) => void;
  setIsMixedPayment: (updater: (current: boolean) => boolean) => void;
  setDeliveryTime: (value: string) => void;
  setDeliveryFee: (value: number) => void;
  setCustomerName: (value: string) => void;
  setCustomerPhone: (value: string) => void;
  setCustomerAddress: (value: string) => void;
  setNotes: (value: string) => void;
  setTipEnabled: (updater: (value: boolean) => boolean) => void;
  setTipAmount: (value: string) => void;
  setTipPaymentMethod: (value: PaymentMethod) => void;
  setTipNotes: (value: string) => void;
  setIsPaid: (value: boolean) => void;
  setDatePaid: (value: string) => void;
}

interface BuildReturnInput {
  form: RentalSheetFormShape;
  customers: Customer[];
  machineItems: MachineItem[];
  shiftOptions: ShiftOption[];
  paymentMethodOptions: PaymentMethodOption[];
  timeSlots: string[];
  deliveryFeeOptions: number[];
  pickupLabel: string;
  subtotalUsdText: string;
  subtotalBs: number;
  tipAmountBs: number;
  totalUsdText: string;
  totalBs: number;
  isMixedPaymentEnabled: boolean;
  isSaving: boolean;
  paidDateLabel: string;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  onToggleMixedPayment: () => void;
  onSelectCustomer: (customerId: string | null) => void;
  onCreateNewCustomer: () => void;
  onToggleTip: () => void;
  onChangePaymentStatus: (value: 'paid' | 'pending') => void;
  onChangeDatePaid: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export function buildRentalSheetViewModelReturn(input: BuildReturnInput) {
  const { form } = input;

  return {
    customers: input.customers,
    machineItems: input.machineItems,
    shiftOptions: input.shiftOptions,
    paymentMethodOptions: input.paymentMethodOptions,
    timeSlots: input.timeSlots,
    deliveryFeeOptions: input.deliveryFeeOptions,
    pickupLabel: input.pickupLabel,
    subtotalUsdText: input.subtotalUsdText,
    subtotalBs: input.subtotalBs,
    tipAmountBs: input.tipAmountBs,
    totalUsdText: input.totalUsdText,
    selectedMachineId: form.machineId,
    selectedShift: form.shift,
    selectedPaymentMethod: form.paymentMethod,
    totalBs: input.totalBs,
    split2Method: form.split2Method,
    split1Amount: form.split1Amount,
    isMixedPaymentEnabled: input.isMixedPaymentEnabled,
    isMixedPayment: form.isMixedPayment,
    deliveryTime: form.deliveryTime,
    deliveryFee: form.deliveryFee,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerAddress: form.customerAddress,
    selectedCustomerId: form.selectedCustomerId,
    notes: form.notes,
    isSaving: input.isSaving,
    tipEnabled: form.tipEnabled,
    tipAmount: form.tipAmount,
    tipPaymentMethod: form.tipPaymentMethod,
    tipNotes: form.tipNotes,
    onSelectMachine: form.setMachineId,
    onSelectShift: form.setShift,
    onSelectPaymentMethod: form.setPaymentMethod,
    onSelectSplit2Method: form.setSplit2Method,
    onChangeSplit1Amount: form.setSplit1Amount,
    onToggleMixedPayment: input.onToggleMixedPayment,
    onSelectDeliveryTime: form.setDeliveryTime,
    onSelectDeliveryFee: form.setDeliveryFee,
    onChangeCustomerName: form.setCustomerName,
    onChangeCustomerPhone: form.setCustomerPhone,
    onChangeCustomerAddress: form.setCustomerAddress,
    onChangeNotes: form.setNotes,
    isPaid: form.isPaid,
    datePaid: form.datePaid,
    paidDateLabel: input.paidDateLabel,
    isCalendarOpen: input.isCalendarOpen,
    setIsCalendarOpen: input.setIsCalendarOpen,
    onChangePaymentStatus: input.onChangePaymentStatus,
    onChangeDatePaid: input.onChangeDatePaid,
    onToggleTip: input.onToggleTip,
    onChangeTipAmount: form.setTipAmount,
    onChangeTipPaymentMethod: form.setTipPaymentMethod,
    onChangeTipNotes: form.setTipNotes,
    onSelectCustomer: input.onSelectCustomer,
    onCreateNewCustomer: input.onCreateNewCustomer,
    onSubmit: input.onSubmit,
  };
}
