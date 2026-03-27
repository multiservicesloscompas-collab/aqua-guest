import supabase from '@/lib/supabaseClient';
import type { Sale } from '@/types';
import { useConfigStore } from './useConfigStore';
import type { TipCaptureInput } from '@/types/tips';
import { salesDataService } from '@/services/SalesDataService';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import { salePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import {
  enqueueOfflineSalePaymentSplitsReplace,
  enqueueOfflineSaleUpdate,
} from '@/offline/enqueue/salesEnqueue';
import {
  calculateFinalSaleTotals,
  mergeTipIntoPaymentSplits,
} from '@/services/transactions/transactionTotals';
import type { WaterSalesState, SaleUpdate } from './useWaterSalesStore.core';

type SetFn = (
  partial:
    | Partial<WaterSalesState>
    | ((state: WaterSalesState) => Partial<WaterSalesState>)
) => void;
type GetFn = () => WaterSalesState;

export async function updateSaleAction(
  id: string,
  updates: Partial<Sale>,
  tipInput: TipCaptureInput | null | undefined,
  set: SetFn,
  get: GetFn
): Promise<void> {
  try {
    const payload: SaleUpdate = {};
    const nowIso = new Date().toISOString();

    const currentSale = get().sales.find((s) => s.id === id);
    const finalExchangeRate =
      currentSale?.exchangeRate ??
      useConfigStore.getState().config.exchangeRate;

    const effectiveUpdates: Partial<Sale> = { ...updates };

    if (tipInput && tipInput.amountBs > 0) {
      // Calculate final totals including tip
      const baseTotalBs = updates.totalBs ?? currentSale?.totalBs ?? 0;
      const finalTotals = calculateFinalSaleTotals({
        principalBs: baseTotalBs,
        tipAmountBs: tipInput.amountBs,
        exchangeRate: finalExchangeRate,
      });

      effectiveUpdates.totalBs = finalTotals.totalBs;
      effectiveUpdates.totalUsd = finalTotals.totalUsd;

      // Merge tip into payment splits
      effectiveUpdates.paymentSplits = mergeTipIntoPaymentSplits({
        paymentSplits: updates.paymentSplits ?? currentSale?.paymentSplits,
        fallbackMethod:
          updates.paymentMethod ?? currentSale?.paymentMethod ?? 'efectivo',
        tipAmountBs: tipInput.amountBs,
        tipPaymentMethod: tipInput.capturePaymentMethod,
        exchangeRate: finalExchangeRate,
        principalBs: baseTotalBs, // Pass base principal amount
      });
    }

    const finalTotalBs = effectiveUpdates.totalBs ?? currentSale?.totalBs;
    const finalTotalUsd = effectiveUpdates.totalUsd ?? currentSale?.totalUsd;

    let splitWrite: ReturnType<typeof preparePaymentWritePayload> | undefined;

    if (
      effectiveUpdates.paymentMethod !== undefined ||
      effectiveUpdates.paymentSplits !== undefined ||
      effectiveUpdates.totalBs !== undefined ||
      effectiveUpdates.totalUsd !== undefined
    ) {
      if (finalTotalBs === undefined || finalTotalUsd === undefined) {
        throw new Error(
          'No se pudo resolver el total para validar métodos de pago'
        );
      }
      splitWrite = preparePaymentWritePayload({
        paymentMethod:
          effectiveUpdates.paymentMethod ??
          currentSale?.paymentMethod ??
          'efectivo',
        paymentSplits:
          effectiveUpdates.paymentSplits ?? currentSale?.paymentSplits,
        totalBs: finalTotalBs,
        totalUsd: finalTotalUsd,
        exchangeRate: finalExchangeRate,
      });
    }

    if (effectiveUpdates.paymentMethod !== undefined)
      payload.payment_method =
        splitWrite?.paymentMethod ?? effectiveUpdates.paymentMethod;
    if (effectiveUpdates.totalBs !== undefined)
      payload.total_bs = effectiveUpdates.totalBs;
    if (effectiveUpdates.totalUsd !== undefined)
      payload.total_usd = effectiveUpdates.totalUsd;
    if (effectiveUpdates.notes !== undefined)
      payload.notes = effectiveUpdates.notes;
    if (effectiveUpdates.items !== undefined)
      payload.items = effectiveUpdates.items;
    payload.updated_at = nowIso;

    const applyLocal = () => {
      set((state) => ({
        sales: state.sales.map((sale) =>
          sale.id === id
            ? {
                ...sale,
                ...effectiveUpdates,
                paymentMethod:
                  splitWrite?.paymentMethod ??
                  effectiveUpdates.paymentMethod ??
                  sale.paymentMethod,
                paymentSplits:
                  splitWrite?.paymentSplits ??
                  effectiveUpdates.paymentSplits ??
                  sale.paymentSplits,
                updatedAt: nowIso,
              }
            : sale
        ),
      }));
    };

    if (!window.navigator.onLine) {
      enqueueOfflineSaleUpdate({ id, payload });
      if (splitWrite) {
        enqueueOfflineSalePaymentSplitsReplace(id, splitWrite.paymentSplits);
      }
      applyLocal();
      const updatedSale = get().sales.find((s) => s.id === id);
      if (updatedSale) salesDataService.invalidateCache(updatedSale.date);
      return;
    }

    const { error } = await supabase.from('sales').update(payload).eq('id', id);
    if (error) throw error;

    if (splitWrite) {
      const { error: deleteSplitsError } = await supabase
        .from(PAYMENT_SPLIT_SCHEMA.salesSplitsTable)
        .delete()
        .eq(PAYMENT_SPLIT_SCHEMA.columns.parentId, id);
      if (deleteSplitsError) throw deleteSplitsError;

      const splitRows = salePaymentSplitAdapter.toInsertRows(
        id,
        splitWrite.paymentSplits
      );
      const { error: splitInsertError } = await supabase
        .from(PAYMENT_SPLIT_SCHEMA.salesSplitsTable)
        .insert(splitRows);
      if (splitInsertError) throw splitInsertError;
    }

    applyLocal();
    const updatedSale = get().sales.find((s) => s.id === id);
    if (updatedSale) salesDataService.invalidateCache(updatedSale.date);
  } catch (err) {
    console.error('Failed to update sale in Supabase', err);
    throw err;
  }
}
