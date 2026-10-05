import type {
  RentalShiftCatalogEntry,
  RentalShiftDraft,
  RentalShiftUpdate,
} from '@aqua-guest/domain';
import { supabase } from '@/lib/supabaseClient';
import { toShiftCode } from '@/utils/shiftCode';
import {
  fromRentalShiftRow,
  toRentalShiftInsertRow,
  toRentalShiftUpdateRow,
  type RentalShiftRow,
} from './rentalShiftSchemaContract';

const RENTAL_SHIFTS_TABLE = 'rental_shifts';
const UNKNOWN_CODE_ERROR = 'The shift label cannot produce a code';

async function listAllCodes(): Promise<string[]> {
  const { data, error } = await supabase
    .from(RENTAL_SHIFTS_TABLE)
    .select('code');
  if (error) throw error;
  return (data ?? []).map((row: { code: string }) => row.code);
}

export const rentalShiftsDataService = {
  async listActive(): Promise<RentalShiftCatalogEntry[]> {
    const { data, error } = await supabase
      .from(RENTAL_SHIFTS_TABLE)
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as RentalShiftRow[]).map(fromRentalShiftRow);
  },

  async create(draft: RentalShiftDraft): Promise<RentalShiftCatalogEntry> {
    const code = toShiftCode(draft.label, await listAllCodes());
    if (code === undefined) throw new Error(UNKNOWN_CODE_ERROR);

    const { data, error } = await supabase
      .from(RENTAL_SHIFTS_TABLE)
      .insert(toRentalShiftInsertRow(draft, code))
      .select('*')
      .single();
    if (error) throw error;
    return fromRentalShiftRow(data as RentalShiftRow);
  },

  async update(id: string, updates: RentalShiftUpdate): Promise<void> {
    const { error } = await supabase
      .from(RENTAL_SHIFTS_TABLE)
      .update({
        ...toRentalShiftUpdateRow(updates),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(RENTAL_SHIFTS_TABLE)
      .update({ deleted_at: now, is_active: false, updated_at: now })
      .eq('id', id);
    if (error) throw error;
  },
};
