import type { Tip, TipPayoutSummary, TipUpsertInput } from '@/types/tips';
import type {
  TipPayoutRpcRow,
  TipRow,
  TipUpsertRow,
} from './tipSchemaContract';

export function toTipUpsertRow(input: TipUpsertInput): TipUpsertRow {
  return {
    origin_type: input.originType,
    origin_id: input.originId,
    tip_date: input.tipDate,
    amount_bs: input.amountBs,
    amount_usd: input.amountUsd,
    exchange_rate_used: input.exchangeRateUsed,
    capture_payment_method: input.capturePaymentMethod,
    notes: input.notes,
  };
}

export function toTipDomain(row: TipRow): Tip {
  return {
    id: row.id,
    originType: row.origin_type,
    originId: row.origin_id,
    tipDate: row.tip_date,
    amountBs: Number(row.amount_bs),
    amountUsd:
      row.amount_usd === null || row.amount_usd === undefined
        ? undefined
        : Number(row.amount_usd),
    exchangeRateUsed:
      row.exchange_rate_used === null || row.exchange_rate_used === undefined
        ? undefined
        : Number(row.exchange_rate_used),
    capturePaymentMethod: row.capture_payment_method,
    status: row.status,
    paidPaymentMethod: row.paid_payment_method ?? undefined,
    paidAt: row.paid_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTipPayoutSummary(row: TipPayoutRpcRow): TipPayoutSummary {
  return {
    date: row.tip_date,
    paymentMethod: row.payment_method,
    paidCount: Number(row.paid_count || 0),
    totalAmountBs: Number(row.total_amount_bs || 0),
  };
}
