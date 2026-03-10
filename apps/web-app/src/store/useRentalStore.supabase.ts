/**
 * useRentalStore.supabase.ts
 * Low-level Supabase I/O helpers for rental payment splits.
 * No Zustand dependency — pure async Supabase calls.
 */
import supabase from '@/lib/supabaseClient';
import type { PaymentSplit } from '@/types/paymentSplits';
import {
  PAYMENT_SPLIT_SCHEMA,
  type PaymentSplitRow,
  type RentalPaymentSplitInsertRow,
} from '@/services/payments/paymentSplitSchemaContract';
import { rentalPaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';

export async function replaceRentalSplits(
  rentalId: string,
  splits: PaymentSplit[]
): Promise<void> {
  const { error: deleteSplitsError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .delete()
    .eq(PAYMENT_SPLIT_SCHEMA.columns.rentalParentId, rentalId);
  if (deleteSplitsError) throw deleteSplitsError;

  const splitRows = rentalPaymentSplitAdapter.toInsertRows(
    rentalId,
    splits
  ) as RentalPaymentSplitInsertRow[];

  if (!splitRows.length) return;

  const { error: splitInsertError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .insert(splitRows);
  if (splitInsertError) throw splitInsertError;
}

export async function fetchRentalSplits(
  rentalId: string
): Promise<PaymentSplit[]> {
  const { data: splitData, error: splitSelectError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable)
    .select('payment_method, amount_bs, amount_usd, exchange_rate_used')
    .eq(PAYMENT_SPLIT_SCHEMA.columns.rentalParentId, rentalId);
  if (splitSelectError) throw splitSelectError;

  return rentalPaymentSplitAdapter.fromRows(
    (splitData ?? []) as PaymentSplitRow[]
  );
}
