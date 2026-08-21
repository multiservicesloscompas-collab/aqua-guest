import type { ExchangeRateHistory } from '@aqua-guest/domain';
import type { ExchangeRatesRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../shared/infrastructure/supabase';
import {
  toExchangeRateHistory,
  toExchangeRatePayload,
} from './core.supabase.mappers';
import type { ExchangeRateRow } from './core.supabase.types';

type SupabaseUpsertClient = SupabaseClientLike<{ data: unknown; error: unknown }> & {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: ExchangeRateRow[] | null; error: unknown }>;
    insert(value: unknown): { select(columns: string): PromiseLike<{ data: ExchangeRateRow[] | ExchangeRateRow | null; error: unknown }> };
    update(value: Record<string, unknown>): { eq(column: string, value: unknown): PromiseLike<{ error: unknown }> };
    delete(): { eq(column: string, value: unknown): PromiseLike<{ error: unknown }> };
    upsert(value: unknown, options: { onConflict: string }): PromiseLike<{ error: unknown }>;
  };
};

const exchangeRatesGetAllConfig: SupabaseGetAllConfig = {
  table: 'exchange_rates',
  select: 'date, rate, updatedAt:updated_at',
  defaultOrderBy: 'date',
  defaultAscending: false,
};

export const createExchangeRatesSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): ExchangeRatesRepository => {
  const repository = createSupabaseBaseRepository<
    ExchangeRateHistory,
    ExchangeRateRow,
    ExchangeRateHistory,
    Partial<ExchangeRateHistory>,
    ExchangeRateHistory['date']
  >({
    supabase: supabase as SupabaseClientLike<{
      data: ExchangeRateRow[] | ExchangeRateRow | null;
      error: unknown;
    }>,
    config: exchangeRatesGetAllConfig,
    toEntity: toExchangeRateHistory,
    toCreatePayload: toExchangeRatePayload,
    toUpdatePayload: toExchangeRatePayload,
    resolveIdColumn: (date) => ({ column: 'date', value: date }),
  });

  const exchangeClient = supabase as SupabaseUpsertClient;

  return {
    ...repository,
    async upsert(entry) {
      const table = exchangeClient.from('exchange_rates');
      if (!table.upsert) {
        throw new Error('Supabase client does not support upsert for exchange rates');
      }

      const { error } = await table.upsert(toExchangeRatePayload(entry), {
        onConflict: 'date',
      });

      if (error) {
        throw error;
      }
    },
  };
};
