import type { Sale } from '@/types';
import { appRepositories } from '@/lib/app-repositories';
import { useConfigStore } from './useConfigStore';
import type { TipCaptureInput } from '@/types/tips';
import { salesDataService } from '@/services/SalesDataService';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';
import {
  enqueueOfflineSalePaymentSplitsReplace,
  enqueueOfflineSaleUpdate,
} from '@/offline/enqueue/salesEnqueue';
import {
  calculateFinalSaleTotals,
  mergeTipIntoPaymentSplits,
} from '@/services/transactions/transactionTotals';
import type { WaterSalesState } from './useWaterSalesStore.core';

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
    const nowIso = new Date().toISOString();

    const currentSale = get().sales.find((s) => s.id === id);
    const finalExchangeRate =
      currentSale?.exchangeRate ??
      useConfigStore.getState().config.exchangeRate;

    const effectiveUpdates: Partial<Sale> = { ...updates };

    if (tipInput && tipInput.amountBs > 0) {
      const baseTotalBs = updates.totalBs ?? currentSale?.totalBs ?? 0;
      const finalTotals = calculateFinalSaleTotals({
        principalBs: baseTotalBs,
        tipAmountBs: tipInput.amountBs,
        exchangeRate: finalExchangeRate,
      });

      effectiveUpdates.totalBs = finalTotals.totalBs;
      effectiveUpdates.totalUsd = finalTotals.totalUsd;

      effectiveUpdates.paymentSplits = mergeTipIntoPaymentSplits({
        paymentSplits: updates.paymentSplits ?? currentSale?.paymentSplits,
        fallbackMethod:
          updates.paymentMethod ?? currentSale?.paymentMethod ?? 'efectivo',
        tipAmountBs: tipInput.amountBs,
        tipPaymentMethod: tipInput.capturePaymentMethod,
        exchangeRate: finalExchangeRate,
        principalBs: baseTotalBs,
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
      enqueueOfflineSaleUpdate({
        id,
        payload: {
          ...(effectiveUpdates.paymentMethod !== undefined
            ? {
                payment_method:
                  splitWrite?.paymentMethod ?? effectiveUpdates.paymentMethod,
              }
            : {}),
          ...(effectiveUpdates.totalBs !== undefined
            ? { total_bs: effectiveUpdates.totalBs }
            : {}),
          ...(effectiveUpdates.totalUsd !== undefined
            ? { total_usd: effectiveUpdates.totalUsd }
            : {}),
          ...(effectiveUpdates.notes !== undefined
            ? { notes: effectiveUpdates.notes }
            : {}),
          ...(effectiveUpdates.items !== undefined
            ? { items: effectiveUpdates.items }
            : {}),
          updated_at: nowIso,
        },
      });
      if (splitWrite) {
        enqueueOfflineSalePaymentSplitsReplace(id, splitWrite.paymentSplits);
      }
      applyLocal();
      const updatedSale = get().sales.find((s) => s.id === id);
      if (updatedSale) salesDataService.invalidateCache(updatedSale.date);
      return;
    }

    await appRepositories.salesRepository.update(id, {
      ...(effectiveUpdates.paymentMethod !== undefined
        ? { paymentMethod: splitWrite?.paymentMethod ?? effectiveUpdates.paymentMethod }
        : {}),
      ...(effectiveUpdates.paymentSplits !== undefined || splitWrite !== undefined
        ? { paymentSplits: splitWrite?.paymentSplits ?? effectiveUpdates.paymentSplits }
        : {}),
      ...(effectiveUpdates.totalBs !== undefined ? { totalBs: effectiveUpdates.totalBs } : {}),
      ...(effectiveUpdates.totalUsd !== undefined
        ? { totalUsd: effectiveUpdates.totalUsd }
        : {}),
      ...(effectiveUpdates.notes !== undefined ? { notes: effectiveUpdates.notes } : {}),
      ...(effectiveUpdates.items !== undefined ? { items: effectiveUpdates.items } : {}),
    });

    applyLocal();
    const updatedSale = get().sales.find((s) => s.id === id);
    if (updatedSale) salesDataService.invalidateCache(updatedSale.date);
  } catch (err) {
    console.error('Failed to update sale in Supabase', err);
    throw err;
  }
}
