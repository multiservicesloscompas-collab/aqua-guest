import type {
  PaymentMethod,
  PaymentSplit,
  RentalShift,
  RentalStatus,
} from '@aqua-guest/domain';
import type { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';

/** Row returned by `insert(...).select('*')` on `rentals`. */
export interface RentalRow {
  id: string;
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  payment_splits?: PaymentSplit[];
  status: RentalStatus;
  is_paid: boolean;
  date_paid?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type RentalInsertRow = {
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  status: RentalStatus;
  is_paid: boolean;
  date_paid: string | null;
  notes?: string;
};

export type RentalUpdateRow = Partial<RentalInsertRow> & {
  customer_id?: string;
  updated_at?: string;
};

/**
 * Tolerant read shape used by `RentalsDataService`: joins `customers` and the
 * split relation, and accepts camelCase timestamps from legacy payloads.
 */
export interface RentalReadRow {
  id: string;
  date: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time?: string;
  pickup_time?: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method?: PaymentMethod;
  status: RentalStatus;
  is_paid: boolean;
  date_paid?: string | null;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  customers?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  rental_payment_splits?: PaymentSplitRow[];
  payment_splits?: PaymentSplitRow[];
  splits?: PaymentSplitRow[];
}
