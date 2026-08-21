import type {
  CartItem,
  PaymentMethod,
  PaymentSplit,
  Sale,
} from '@aqua-guest/domain';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import { salePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import {
  createOfflineTempId,
  enqueueOfflineOriginTipDelete,
  enqueueOfflineOriginTipUpsert,
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryMutation,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

interface EnqueueOfflineSaleInput {
  newSalePayload: Record<string, unknown>;
  paymentSplits?: PaymentSplit[];
  dailyNumber: number;
  date: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
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

export const enqueueOfflineSale = (input: EnqueueOfflineSaleInput): Sale => {
  const tempId = createOfflineTempId();
  const businessKey = `sale:${input.date}:${input.dailyNumber}`;
  const enqueueSource = input.actionSource ?? 'water-sales/completeSale';

  enqueueOfflineRepositoryCreate({
    table: 'sales',
    repository: 'sales',
    input: {
      tempId,
      dailyNumber: input.dailyNumber,
      date: input.date,
      items: input.items,
      paymentMethod: input.paymentMethod,
      paymentSplits: input.paymentSplits,
      totalBs: input.totalBs,
      totalUsd: input.totalUsd,
      exchangeRate: input.exchangeRate,
      notes: input.notes,
    },
    payload: { ...input.newSalePayload, tempId },
    enqueueSource,
    businessKey,
  });

  if (input.paymentSplits?.length) {
    enqueueOfflineRepositoryMutation({
      type: 'UPDATE',
      table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
      repository: 'sales',
      operation: 'update',
      input: {
        id: tempId,
        updates: { paymentSplits: input.paymentSplits },
      },
      payload: { id: tempId },
      enqueueSource,
      businessKey: `sale-splits:${tempId}`,
      dependencyKeys: [businessKey],
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

  enqueueOfflineRepositoryUpdate({
    table: 'sales',
    repository: 'sales',
    id: input.id,
    updates: input.payload,
    payload: input.payload,
    enqueueSource: input.actionSource ?? 'water-sales/updateSale',
    businessKey,
  });
};

export const enqueueOfflineSaleDelete = (
  input: EnqueueOfflineSaleDeleteInput
) => {
  const businessKey = buildSaleBusinessKey(input.id);

  enqueueOfflineRepositoryDelete({
    table: 'sales',
    repository: 'sales',
    id: input.id,
    enqueueSource: input.actionSource ?? 'water-sales/deleteSale',
    businessKey,
  });
};

export const enqueueOfflineSalePaymentSplitsReplace = (
  saleId: string,
  splits: PaymentSplit[],
  actionSource = 'water-sales/updateSale'
) => {
  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
    repository: 'sales',
    operation: 'update',
    input: {
      id: saleId,
      updates: { paymentSplits: splits },
    },
    payload: {
      id: saleId,
      splits: salePaymentSplitAdapter.toInsertRows(saleId, splits),
      __legacyRepositorySemantic: true,
    },
    enqueueSource: actionSource,
    businessKey: `sale-splits:${saleId}`,
  });
};

export const enqueueOfflineSalePaymentSplitsDelete = (
  saleId: string,
  actionSource = 'water-sales/deleteSale'
) => {
  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table: PAYMENT_SPLIT_SCHEMA.salesSplitsTable,
    repository: 'sales',
    operation: 'update',
    input: {
      id: saleId,
      updates: { paymentSplits: [] },
    },
    payload: { id: saleId, __legacyRepositorySemantic: true },
    enqueueSource: actionSource,
    businessKey: `sale-splits:${saleId}`,
  });
};

export const enqueueOfflineSaleTipDelete = (
  saleId: string,
  actionSource = 'water-sales/deleteSale'
) => {
  enqueueOfflineOriginTipDelete({
    entityId: saleId,
    originType: 'sale',
    enqueueSource: actionSource,
    businessKey: `tip-origin-sale:${saleId}`,
  });
};

interface EnqueueOfflineSaleTipUpsertInput {
  saleId: string;
  tipDate: string;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
  actionSource?: string;
}

export const enqueueOfflineSaleTipUpsert = (
  input: EnqueueOfflineSaleTipUpsertInput
) => {
  enqueueOfflineOriginTipUpsert({
    entityId: input.saleId,
    originType: 'sale',
    tipDate: input.tipDate,
    amountBs: input.amountBs,
    amountUsd: input.amountUsd,
    exchangeRateUsed: input.exchangeRateUsed,
    capturePaymentMethod: input.capturePaymentMethod,
    notes: input.notes,
    enqueueSource: input.actionSource ?? 'water-sales/updateSale',
    businessKey: `tip-origin-sale:${input.saleId}`,
    tempDependencyBusinessKey: `sale:${input.saleId}`,
  });
};
