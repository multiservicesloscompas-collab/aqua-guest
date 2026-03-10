import type { Sale } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import { salePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import { useSyncStore } from '@/store/useSyncStore';

interface EnqueueOfflineSaleInput {
  newSalePayload: Record<string, unknown>;
  paymentSplits?: PaymentSplit[];
  dailyNumber: number;
  date: string;
  items: Sale['items'];
  paymentMethod: Sale['paymentMethod'];
  totalBs: number;
  totalUsd: number;
  exchangeRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  actionSource?: string;
}

interface EnqueueOfflineSaleUpdateInput {
  id: string;
  payload: Record<string, unknown>;
  actionSource?: string;
}

interface EnqueueOfflineSaleDeleteInput {
  id: string;
  actionSource?: string;
}

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

export const enqueueOfflineSale = (input: EnqueueOfflineSaleInput): Sale => {
  const tempId = generateTempId();

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'sales',
    payload: { ...input.newSalePayload, tempId },
    enqueueSource: input.actionSource ?? 'water-sales/completeSale',
    businessKey: `sale:${input.date}:${input.dailyNumber}`,
  });

  if (input.paymentSplits?.length) {
    useSyncStore.getState().addToQueue({
      type: 'INSERT',
      table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
      payload: {
        splits: salePaymentSplitAdapter.toInsertRows(
          tempId,
          input.paymentSplits
        ),
        isSplit: true,
        parentId: tempId,
      },
      enqueueSource: input.actionSource ?? 'water-sales/completeSale',
      businessKey: `sale-splits:${tempId}`,
      dependencyKeys: [`sale:${input.date}:${input.dailyNumber}`],
    });
  }

  return {
    id: tempId,
    dailyNumber: input.dailyNumber,
    date: input.date,
    items: input.items,
    paymentMethod: input.paymentMethod,
    paymentSplits: input.paymentSplits,
    totalBs: input.totalBs,
    totalUsd: input.totalUsd,
    exchangeRate: input.exchangeRate,
    notes: input.notes,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
};

const buildSaleBusinessKey = (id: string) => `sale:${id}`;

export const enqueueOfflineSaleUpdate = (
  input: EnqueueOfflineSaleUpdateInput
) => {
  const businessKey = buildSaleBusinessKey(input.id);

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'sales',
    payload: {
      id: input.id,
      ...input.payload,
    },
    enqueueSource: input.actionSource ?? 'water-sales/updateSale',
    businessKey,
    dependencyKeys: input.id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineSaleDelete = (
  input: EnqueueOfflineSaleDeleteInput
) => {
  const businessKey = buildSaleBusinessKey(input.id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'sales',
    payload: { id: input.id },
    enqueueSource: input.actionSource ?? 'water-sales/deleteSale',
    businessKey,
    dependencyKeys: input.id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineSalePaymentSplitsReplace = (
  saleId: string,
  splits: PaymentSplit[],
  actionSource = 'water-sales/updateSale'
) => {
  const businessKey = `sale-splits:${saleId}`;

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
    payload: {
      id: `sale_id:${saleId}`,
      parentId: saleId,
      parentColumn: 'sale_id',
      __op: 'delete_by_parent_id',
    },
    enqueueSource: actionSource,
    businessKey,
  });

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
    payload: {
      splits: salePaymentSplitAdapter.toInsertRows(saleId, splits),
      isSplit: true,
      parentId: saleId,
    },
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineSalePaymentSplitsDelete = (
  saleId: string,
  actionSource = 'water-sales/deleteSale'
) => {
  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
    payload: {
      id: `sale_id:${saleId}`,
      parentId: saleId,
      parentColumn: 'sale_id',
      __op: 'delete_by_parent_id',
    },
    enqueueSource: actionSource,
    businessKey: `sale-splits:${saleId}`,
  });
};
