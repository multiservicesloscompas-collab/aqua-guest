import type {
  PaymentMethod,
  PrepaidOrder,
  PrepaidStatus,
} from '@aqua-guest/domain';

/** Tolerant read shape: also accepts camelCase aliases from legacy payloads. */
export type PrepaidOrderRow = {
  id: string;
  customer_name?: string | null;
  customerName?: string | null;
  customer_phone?: string | null;
  customerPhone?: string | null;
  liters: number | string;
  amount_bs?: number | string | null;
  amountBs?: number | string | null;
  amount_usd?: number | string | null;
  amountUsd?: number | string | null;
  exchange_rate?: number | string | null;
  exchangeRate?: number | string | null;
  payment_method?: PaymentMethod;
  paymentMethod?: PaymentMethod;
  status: PrepaidStatus;
  date_paid?: string | null;
  datePaid?: string | null;
  date_delivered?: string | null;
  dateDelivered?: string | null;
  notes?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

export type PrepaidOrderUpdateRow = {
  customer_name?: string;
  customer_phone?: string;
  liters?: number;
  amount_bs?: number;
  amount_usd?: number;
  exchange_rate?: number;
  payment_method?: PrepaidOrder['paymentMethod'];
  status?: PrepaidOrder['status'];
  date_paid?: string;
  date_delivered?: string;
  notes?: string;
  updated_at?: string;
};
