import type {
  PaymentBalanceOperationType,
  PaymentMethod,
} from '@aqua-guest/domain';

export type PaymentBalanceInsertRow = {
  date: string;
  operation_type?: PaymentBalanceOperationType;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number;
  amount_usd?: number;
  amount_out_bs?: number;
  amount_out_usd?: number;
  amount_in_bs?: number;
  amount_in_usd?: number;
  difference_bs?: number;
  difference_usd?: number;
  notes?: string;
};

export type PaymentBalanceUpdateRow = Partial<PaymentBalanceInsertRow> & {
  updated_at: string;
};

export type PaymentBalanceRow = {
  id: string;
  date: string;
  operation_type?: PaymentBalanceOperationType | null;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number | string;
  amount_bs?: number | string | null;
  amount_usd?: number | string | null;
  amount_out_bs?: number | string | null;
  amount_out_usd?: number | string | null;
  amount_in_bs?: number | string | null;
  amount_in_usd?: number | string | null;
  difference_bs?: number | string | null;
  difference_usd?: number | string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
