import type {
  RentalShiftCatalogEntry,
  RentalShiftDraft,
  RentalShiftUpdate,
} from '@aqua-guest/domain';

export type RentalShiftRow = {
  id: string;
  code: string;
  label: string;
  price_usd: number;
  hours: number;
  divisa_discount_usd: number;
  is_active: boolean;
  deleted_at: string | null;
};

export type RentalShiftInsertRow = {
  code: string;
  label: string;
  price_usd: number;
  hours: number;
  divisa_discount_usd: number;
};

export type RentalShiftUpdateRow = {
  label?: string;
  price_usd?: number;
  hours?: number;
  divisa_discount_usd?: number;
  updated_at?: string;
};

export function fromRentalShiftRow(
  row: RentalShiftRow
): RentalShiftCatalogEntry {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    priceUsd: Number(row.price_usd),
    hours: Number(row.hours),
    divisaDiscountUsd: Number(row.divisa_discount_usd),
  };
}

export function toRentalShiftInsertRow(
  draft: RentalShiftDraft,
  code: string
): RentalShiftInsertRow {
  return {
    code,
    label: draft.label,
    price_usd: draft.priceUsd,
    hours: draft.hours,
    divisa_discount_usd: draft.divisaDiscountUsd,
  };
}

export function toRentalShiftUpdateRow(
  updates: RentalShiftUpdate
): RentalShiftUpdateRow {
  const row: RentalShiftUpdateRow = {};
  if (updates.label !== undefined) row.label = updates.label;
  if (updates.priceUsd !== undefined) row.price_usd = updates.priceUsd;
  if (updates.hours !== undefined) row.hours = updates.hours;
  if (updates.divisaDiscountUsd !== undefined)
    row.divisa_discount_usd = updates.divisaDiscountUsd;
  return row;
}
