import type {
  Customer,
  PrepaidOrder,
  RentalShiftConfig,
  WasherRental,
  WashingMachine,
} from '@aqua-guest/domain';
import type {
  PaymentSplitInsertRow,
  PaymentSplitRow,
} from '../../../../shared/infrastructure/supabase';

type NumericLike<T extends number | undefined> = T | string;

export const RENTAL_PAYMENT_SPLITS_TABLE = 'rental_payment_splits';

export type RentalPaymentSplitInsertRow = PaymentSplitInsertRow<'rental_id'>;

export type CustomerRow = Customer;

export interface WashingMachineRow extends Omit<WashingMachine, 'isAvailable'> {
  isAvailable: WashingMachine['isAvailable'];
}

export interface RentalShiftRow {
  id: RentalShiftConfig['id'];
  label: RentalShiftConfig['label'];
  priceUsd: NumericLike<RentalShiftConfig['priceUsd']>;
  hours: NumericLike<RentalShiftConfig['hours']>;
  hasDivisaDiscount: RentalShiftConfig['hasDivisaDiscount'];
  divisaDiscountAmount: NumericLike<RentalShiftConfig['divisaDiscountAmount']>;
  isActive: RentalShiftConfig['isActive'];
  createdAt?: RentalShiftConfig['createdAt'] | null;
  updatedAt?: RentalShiftConfig['updatedAt'] | null;
}

export interface PrepaidOrderRow
  extends Pick<
    PrepaidOrder,
    'id' | 'customerName' | 'customerPhone' | 'status' | 'datePaid'
  > {
  liters: NumericLike<PrepaidOrder['liters']>;
  amountBs: NumericLike<PrepaidOrder['amountBs']>;
  amountUsd: NumericLike<PrepaidOrder['amountUsd']>;
  exchangeRate: NumericLike<PrepaidOrder['exchangeRate']>;
  paymentMethod: PrepaidOrder['paymentMethod'];
  dateDelivered?: PrepaidOrder['dateDelivered'] | null;
  notes?: PrepaidOrder['notes'] | null;
  createdAt?: PrepaidOrder['createdAt'] | null;
  updatedAt?: PrepaidOrder['updatedAt'] | null;
}

export interface RentalCustomerJoin {
  name?: Customer['name'] | null;
  phone?: Customer['phone'] | null;
  address?: Customer['address'] | null;
}

export interface WasherRentalRow
  extends Pick<WasherRental, 'id' | 'date' | 'shift' | 'status' | 'isPaid'> {
  customerId?: WasherRental['customerId'] | null;
  customerName?: WasherRental['customerName'] | null;
  customerPhone?: WasherRental['customerPhone'] | null;
  customerAddress?: WasherRental['customerAddress'] | null;
  machineId: WasherRental['machineId'];
  deliveryTime?: WasherRental['deliveryTime'] | null;
  pickupTime?: WasherRental['pickupTime'] | null;
  pickupDate: WasherRental['pickupDate'];
  deliveryFee: NumericLike<WasherRental['deliveryFee']>;
  totalUsd: NumericLike<WasherRental['totalUsd']>;
  paymentMethod?: WasherRental['paymentMethod'] | null;
  datePaid?: WasherRental['datePaid'] | null;
  notes?: WasherRental['notes'] | null;
  createdAt?: WasherRental['createdAt'] | null;
  updatedAt?: WasherRental['updatedAt'] | null;
  customers?: RentalCustomerJoin | null;
  paymentSplits?: PaymentSplitRow[] | null;
}
