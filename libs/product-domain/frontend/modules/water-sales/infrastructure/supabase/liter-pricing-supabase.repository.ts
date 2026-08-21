import type { LiterPricing } from '@aqua-guest/domain';
import type { LiterPricingRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toLiterPricing,
  toLiterPricingCreatePayload,
  toLiterPricingUpdatePayload,
} from './water-sales.supabase.mappers';
import type { LiterPricingRow } from './water-sales.supabase.types';

const literPricingGetAllConfig: SupabaseGetAllConfig = {
  table: 'liter_pricing',
  select: 'id, breakpoint, price',
  defaultOrderBy: 'breakpoint',
  defaultAscending: true,
};

export const createLiterPricingSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): LiterPricingRepository => {
  const baseRepository = createSupabaseBaseRepository<
    LiterPricing,
    LiterPricingRow,
    LiterPricing,
    Partial<LiterPricing>,
    LiterPricing['breakpoint']
  >({
    supabase: supabase as SupabaseClientLike<{
      data: LiterPricingRow[] | LiterPricingRow | null;
      error: unknown;
    }>,
    config: literPricingGetAllConfig,
    toEntity: toLiterPricing,
    toCreatePayload: toLiterPricingCreatePayload,
    toUpdatePayload: toLiterPricingUpdatePayload,
    resolveIdColumn: (breakpoint) => ({
      column: 'breakpoint',
      value: breakpoint,
    }),
  });

  return {
    ...baseRepository,
    async replace(items) {
      const literPricingReadClient = supabase as SupabaseClientLike<{
        data: LiterPricingRow[] | LiterPricingRow | null;
        error: unknown;
      }>;
      const literPricingWriteClient = supabase as SupabaseClientLike<{
        data: null;
        error: unknown;
      }>;

      const { data: existingPricing, error: fetchError } = await literPricingReadClient
        .from('liter_pricing')
        .select('id, breakpoint, price');

      if (fetchError) {
        throw fetchError;
      }

      const existingRows = Array.isArray(existingPricing)
        ? (existingPricing as LiterPricingRow[])
        : [];

      const payload = items.map((item) => {
        const existing = existingRows.find(
          (row) => Number(row.breakpoint) === Number(item.breakpoint)
        );

        return {
          ...(existing ? { id: existing.id } : {}),
          breakpoint: item.breakpoint,
          price: item.price,
        };
      });

      const updates = payload.filter((item) => 'id' in item);
      const inserts = payload.filter((item) => !('id' in item));
      const keptIds = new Set(updates.map((item) => item.id));
      const removals = existingRows.filter((row) => !keptIds.has(row.id));

      for (const removal of removals) {
        const { error } = await literPricingWriteClient
          .from('liter_pricing')
          .delete()
          .eq('id', removal.id);

        if (error) {
          throw error;
        }
      }

      for (const updateItem of updates) {
        const { id, ...changes } = updateItem;
        const { error } = await literPricingWriteClient
          .from('liter_pricing')
          .update(changes)
          .eq('id', id);

        if (error) {
          throw error;
        }
      }

      if (inserts.length > 0) {
        const { error } = await literPricingWriteClient
          .from('liter_pricing')
          .insert(inserts);
        if (error) {
          throw error;
        }
      }
    },
  };
};
