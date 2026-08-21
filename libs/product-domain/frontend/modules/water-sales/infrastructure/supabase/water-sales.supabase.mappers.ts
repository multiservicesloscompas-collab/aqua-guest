import type { LiterPricing, Product, Sale, SaleDraft } from '@aqua-guest/domain';
import { fromPaymentSplitRows } from '../../../../shared/infrastructure/supabase';
import type {
  LiterPricingRow,
  ProductRow,
  SaleRow,
} from './water-sales.supabase.types';

const getSafeTimestamp = () => new Date().toISOString();

const normalizeTimestamp = (value: string | undefined, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

export const toSale = (row: SaleRow, dateOverride?: string): Sale => {
  const splits = fromPaymentSplitRows(row.paymentSplits ?? []);

  return {
    id: row.id,
    dailyNumber: row.dailyNumber ?? 0,
    date: dateOverride ?? row.date,
    items: row.items ?? [],
    paymentMethod: row.paymentMethod ?? 'efectivo',
    paymentSplits: splits.length > 0 ? splits : undefined,
    totalBs: Number(row.totalBs ?? 0),
    totalUsd: Number(row.totalUsd ?? 0),
    exchangeRate: Number(row.exchangeRate ?? 0),
    notes: row.notes ?? undefined,
    createdAt: normalizeTimestamp(row.createdAt ?? undefined, getSafeTimestamp()),
    updatedAt: normalizeTimestamp(row.updatedAt ?? undefined, getSafeTimestamp()),
  };
};

export const toSaleCreatePayload = (input: SaleDraft): Record<string, unknown> => ({
  daily_number: input.dailyNumber,
  date: input.date,
  items: input.items,
  payment_method: input.paymentMethod,
  total_bs: input.totalBs,
  total_usd: input.totalUsd,
  exchange_rate: input.exchangeRate,
  notes: input.notes,
});

export const toSaleUpdatePayload = (
  input: Partial<SaleDraft>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.dailyNumber !== undefined) payload.daily_number = input.dailyNumber;
  if (input.date !== undefined) payload.date = input.date;
  if (input.items !== undefined) payload.items = input.items;
  if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod;
  if (input.totalBs !== undefined) payload.total_bs = input.totalBs;
  if (input.totalUsd !== undefined) payload.total_usd = input.totalUsd;
  if (input.exchangeRate !== undefined) payload.exchange_rate = input.exchangeRate;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
};

export const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  defaultPrice: Number(row.defaultPrice),
  requiresLiters: row.requiresLiters,
  minLiters: row.minLiters ?? undefined,
  maxLiters: row.maxLiters ?? undefined,
});

export const toProductCreatePayload = (
  input: Omit<Product, 'id'>
): Record<string, unknown> => ({
  name: input.name,
  default_price: input.defaultPrice,
  requires_liters: input.requiresLiters,
  min_liters: input.minLiters,
  max_liters: input.maxLiters,
});

export const toProductUpdatePayload = (
  input: Partial<Omit<Product, 'id'>>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.defaultPrice !== undefined) payload.default_price = input.defaultPrice;
  if (input.requiresLiters !== undefined) payload.requires_liters = input.requiresLiters;
  if (input.minLiters !== undefined) payload.min_liters = input.minLiters;
  if (input.maxLiters !== undefined) payload.max_liters = input.maxLiters;

  return payload;
};

export const toLiterPricing = (row: LiterPricingRow): LiterPricing => ({
  breakpoint: Number(row.breakpoint),
  price: Number(row.price),
});

export const toLiterPricingCreatePayload = (
  input: LiterPricing
): Record<string, unknown> => ({
  breakpoint: input.breakpoint,
  price: input.price,
});

export const toLiterPricingUpdatePayload = (
  input: Partial<LiterPricing>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (input.breakpoint !== undefined) payload.breakpoint = input.breakpoint;
  if (input.price !== undefined) payload.price = input.price;

  return payload;
};
