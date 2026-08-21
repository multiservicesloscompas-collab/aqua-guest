import type { PaymentMethod, PaymentSplit, Sale } from '@aqua-guest/domain';
import { getSafeTimestamp, normalizeTimestamp } from '@/lib/date-utils';
import { appRepositories } from '@/lib/app-repositories';
import { dateService } from '@/services/DateService';
import { salesDataService } from '@/services/SalesDataService';
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
    principalBs,
  });

  const splitWrite = preparePaymentWritePayload({
    paymentMethod,
    paymentSplits: mergedSplits,
    totalBs: finalTotals.totalBs,
    totalUsd: finalTotals.totalUsd,
    exchangeRate,
  });

  try {
    if (!window.navigator.onLine) {
      const sale = enqueueOfflineSale({
        newSalePayload: {
          daily_number: dailyNumber,
          date: normalizedDate,
          items: state.cart,
          payment_method: splitWrite.paymentMethod,
          total_bs: finalTotals.totalBs,
          total_usd: finalTotals.totalUsd,
          exchange_rate: exchangeRate,
          notes: notes || undefined,
        },
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

    const createdSale = await appRepositories.salesRepository.create({
      dailyNumber,
      date: normalizedDate,
      items: state.cart,
      paymentMethod: splitWrite.paymentMethod,
      paymentSplits: splitWrite.paymentSplits,
      totalBs: finalTotals.totalBs,
      totalUsd: finalTotals.totalUsd,
      exchangeRate,
      notes: notes || undefined,
    });

    const sale: Sale = {
      ...createdSale,
      createdAt: normalizeTimestamp(createdSale.createdAt, safeCreatedAt),
      updatedAt: normalizeTimestamp(createdSale.updatedAt, safeUpdatedAt),
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

    await appRepositories.salesRepository.delete(id);
    set((state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }));
    if (saleToDelete) salesDataService.invalidateCache(saleToDelete.date);
  } catch (err) {
    console.error('Failed to delete sale from Supabase', err);
    throw err;
  }
}
