/**
 * useWaterSalesStore.actions.ts
 * Extracted async action implementations for the water sales Zustand store.
 * Each function accepts Zustand's set/get so they can be used inside create().
 */
import supabase from '@/lib/supabaseClient';
import { Sale } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { PaymentMethod } from '@/types';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import { dateService } from '@/services/DateService';
import { salesDataService } from '@/services/SalesDataService';
import {
  PAYMENT_SPLIT_SCHEMA,
  type PaymentSplitRow,
} from '@/services/payments/paymentSplitSchemaContract';
import { salePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import {
  enqueueOfflineSale,
  enqueueOfflineSaleDelete,
  enqueueOfflineSalePaymentSplitsDelete,
  enqueueOfflineSaleTipDelete,
} from '@/offline/enqueue/salesEnqueue';
import { useConfigStore } from './useConfigStore';
import {
  type WaterSalesState,
  type SaleInsert,
  type SalesRow,
} from './useWaterSalesStore.core';
import type { TipCaptureInput } from '@/types/tips';
import {
  calculateFinalSaleTotals,
  mergeTipIntoPaymentSplits,
} from '@/services/transactions/transactionTotals';
export { updateSaleAction } from './useWaterSalesStore.actions.update';

type SetFn = (
  partial:
    | Partial<WaterSalesState>
    | ((state: WaterSalesState) => Partial<WaterSalesState>)
) => void;
type GetFn = () => WaterSalesState;

export async function completeSaleAction(
  paymentMethod: PaymentMethod,
  selectedDate: string,
  notes: string | undefined,
  paymentSplits: PaymentSplit[] | undefined,
  tipInput: TipCaptureInput | undefined,
  set: SetFn,
  get: GetFn
): Promise<Sale> {
  const state = get();
  const configState = useConfigStore.getState();
  const exchangeRate = configState.config.exchangeRate;

  const principalBs = state.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const normalizedDate = dateService.normalizeSaleDate(selectedDate);
  const salesOfDay = state.sales.filter((s) => s.date === normalizedDate);
  const dailyNumber = salesOfDay.length + 1;

  const safeCreatedAt = getSafeTimestamp();
  const safeUpdatedAt = getSafeTimestamp();
  const finalTotals = calculateFinalSaleTotals({
    principalBs,
    tipAmountBs: tipInput?.amountBs,
    exchangeRate,
  });

  const mergedSplits = mergeTipIntoPaymentSplits({
    paymentSplits,
    fallbackMethod: paymentMethod,
    tipAmountBs: tipInput?.amountBs ?? 0,
    tipPaymentMethod: tipInput?.capturePaymentMethod ?? paymentMethod,
    exchangeRate,
    principalBs, // Pass principal amount
  });

  const splitWrite = preparePaymentWritePayload({
    paymentMethod,
    paymentSplits: mergedSplits,
    totalBs: finalTotals.totalBs,
    totalUsd: finalTotals.totalUsd,
    exchangeRate,
  });

  const newSalePayload: SaleInsert = {
    daily_number: dailyNumber,
    date: normalizedDate,
    items: state.cart,
    payment_method: splitWrite.paymentMethod,
    total_bs: finalTotals.totalBs,
    total_usd: finalTotals.totalUsd,
    exchange_rate: exchangeRate,
    notes: notes || undefined,
  };

  try {
    if (!window.navigator.onLine) {
      const sale = enqueueOfflineSale({
        newSalePayload,
        paymentSplits: splitWrite.paymentSplits,
        dailyNumber,
        date: normalizedDate,
        items: state.cart,
        paymentMethod: splitWrite.paymentMethod,
        totalBs: finalTotals.totalBs,
        totalUsd: finalTotals.totalUsd,
        exchangeRate,
        notes: notes || undefined,
        createdAt: safeCreatedAt,
        updatedAt: safeUpdatedAt,
      });
      set((s) => ({ sales: [...s.sales, sale], cart: [] }));
      return sale;
    }

    const { data, error } = await supabase
      .from('sales')
      .insert(newSalePayload)
      .select('*')
      .single();
    if (error) throw error;

    const saleRow = data as SalesRow | null;
    if (!saleRow) throw new Error('Error al crear la venta');

    const { error: deleteSplitsError } = await supabase
      .from(PAYMENT_SPLIT_SCHEMA.salesSplitsTable)
      .delete()
      .eq(PAYMENT_SPLIT_SCHEMA.columns.parentId, saleRow.id);
    if (deleteSplitsError) throw deleteSplitsError;

    const splitRows = salePaymentSplitAdapter.toInsertRows(
      saleRow.id,
      splitWrite.paymentSplits
    );
    const { error: splitInsertError } = await supabase
      .from(PAYMENT_SPLIT_SCHEMA.salesSplitsTable)
      .insert(splitRows);
    if (splitInsertError) throw splitInsertError;

    const { data: splitData, error: splitSelectError } = await supabase
      .from(PAYMENT_SPLIT_SCHEMA.salesSplitsTable)
      .select('payment_method, amount_bs, amount_usd, exchange_rate_used')
      .eq(PAYMENT_SPLIT_SCHEMA.columns.parentId, saleRow.id);
    if (splitSelectError) throw splitSelectError;

    const saleDate = dateService.normalizeSaleDate(
      saleRow.date || normalizedDate
    );
    const normalizedSplits = salePaymentSplitAdapter.fromRows(
      (splitData ?? []) as PaymentSplitRow[]
    );

    const sale: Sale = {
      id: saleRow.id,
      dailyNumber: saleRow.daily_number,
      date: saleDate,
      items: saleRow.items,
      paymentMethod: splitWrite.paymentMethod,
      paymentSplits: normalizedSplits,
      totalBs: Number(saleRow.total_bs),
      totalUsd: Number(saleRow.total_usd),
      exchangeRate: Number(saleRow.exchange_rate),
      notes: saleRow.notes || undefined,
      createdAt: normalizeTimestamp(
        saleRow.created_at ?? undefined,
        safeCreatedAt
      ),
      updatedAt: normalizeTimestamp(
        saleRow.updated_at ?? undefined,
        safeUpdatedAt
      ),
    };

    set((s) => ({ sales: [...s.sales, sale], cart: [] }));
    salesDataService.invalidateCache(sale.date);
    return sale;
  } catch (err) {
    console.error('Failed to create sale in Supabase', err);
    throw err;
  }
}

export async function deleteSaleAction(
  id: string,
  set: SetFn,
  get: GetFn,
  deleteTipByOrigin?: (originType: 'sale', originId: string) => Promise<void>
): Promise<void> {
  const saleToDelete = get().sales.find((s) => s.id === id);
  try {
    if (!window.navigator.onLine) {
      enqueueOfflineSaleDelete({ id });
      enqueueOfflineSalePaymentSplitsDelete(id);
      enqueueOfflineSaleTipDelete(id);
      set((state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }));
      if (saleToDelete) salesDataService.invalidateCache(saleToDelete.date);
      return;
    }

    if (deleteTipByOrigin) {
      await deleteTipByOrigin('sale', id);
    }

    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }));
    if (saleToDelete) salesDataService.invalidateCache(saleToDelete.date);
  } catch (err) {
    console.error('Failed to delete sale from Supabase', err);
    throw err;
  }
}
