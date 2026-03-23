import type { PaymentMethod, TipOriginType } from '@/types';

export const TIP_SCHEMA_CONTRACT = {
  tables: {
    tips: 'tips',
  },
  columns: {
    id: 'id',
    originType: 'origin_type',
    originId: 'origin_id',
    tipDate: 'tip_date',
    amountBs: 'amount_bs',
    amountUsd: 'amount_usd',
    exchangeRateUsed: 'exchange_rate_used',
    capturePaymentMethod: 'capture_payment_method',
    status: 'status',
    paidPaymentMethod: 'paid_payment_method',
    paidAt: 'paid_at',
    notes: 'notes',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  rpc: {
    payTipsForDay: 'pay_tips_for_day',
    paySingleTip: 'pay_single_tip',
  },
} as const;

export interface TipRow {
  id: string;
  origin_type: TipOriginType;
  origin_id: string;
  tip_date: string;
  amount_bs: number;
  amount_usd?: number | null;
  exchange_rate_used?: number | null;
  capture_payment_method: PaymentMethod;
  status: 'pending' | 'paid';
  paid_payment_method?: PaymentMethod | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TipUpsertRow {
  origin_type: TipOriginType;
  origin_id: string;
  tip_date: string;
  amount_bs: number;
  amount_usd?: number;
  exchange_rate_used?: number;
  capture_payment_method: PaymentMethod;
  notes?: string;
}

export interface TipPayoutRpcRow {
  paid_count: number;
  total_amount_bs: number;
  tip_date: string;
  payment_method: PaymentMethod;
}
