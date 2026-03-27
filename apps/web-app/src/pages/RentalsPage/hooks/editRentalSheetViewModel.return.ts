import { PaymentMethod, RentalShift, RentalStatus } from '@/types';

type PaymentStatus = 'paid' | 'pending';

interface BuildEditRentalSheetViewModelParams {
  customers: unknown[];
  machineItems: unknown[];
  shiftOptions: unknown[];
  paymentMethodOptions: unknown[];
  timeSlots: string[];
  deliveryFeeOptions: number[];
  pickupLabel: string;
  totalUsdText: string;
  status: RentalStatus;
  isPaid: boolean;
  datePaid: string;
  paidDateLabel: string;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (value: boolean) => void;
  isLoading: boolean;
  selectedMachineId: string;
  selectedShift: RentalShift;
  selectedPaymentMethod: PaymentMethod;
  totalBs: number;
  split2Method: PaymentMethod;
  split1Amount: string;
  isMixedPaymentEnabled: boolean;
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
  onSelectMachine: (value: string) => void;
  onSelectShift: (value: RentalShift) => void;
  onSelectPaymentMethod: (value: PaymentMethod) => void;
  onSelectSplit2Method: (value: PaymentMethod) => void;
  onChangeSplit1Amount: (value: string) => void;
  onToggleMixedPayment: () => void;
  onSelectDeliveryTime: (value: string) => void;
  onSelectDeliveryFee: (value: number) => void;
  onChangeCustomerName: (value: string) => void;
  onChangeCustomerPhone: (value: string) => void;
  onChangeCustomerAddress: (value: string) => void;
  onSelectCustomer: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onToggleTip: () => void;
  onChangeTipAmount: (value: string) => void;
  onChangeTipPaymentMethod: (value: PaymentMethod) => void;
  onChangeTipNotes: (value: string) => void;
  onChangeStatus: (value: RentalStatus) => void;
  onChangePaymentStatus: (value: PaymentStatus) => void;
  onChangeDatePaid: (value: string) => void;
  onSubmit: () => Promise<void>;
  statusOptions: Array<{ value: RentalStatus; label: string }>;
}

export function buildEditRentalSheetViewModel(
  params: BuildEditRentalSheetViewModelParams
) {
  return {
    ...params,
  };
}
