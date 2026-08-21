import type { GetAllInput } from '../../domain';
import type { BaseRepository } from '../../domain';
import type { SupabaseGetAllConfig } from './query-builder.types';
import type { SupabaseClientLike } from './supabase-like.types';
import { applyGetAllQuery } from './apply-get-all-query';

const resolveSelectResult = async <TResult extends { data: unknown; error: unknown }>(
  query: PromiseLike<TResult> & { single?: () => PromiseLike<TResult> }
): Promise<TResult> => {
  if (query.single) {
    return await query.single();
  }

  return await query;
};

export interface CreateSupabaseBaseRepositoryParams<
  TEntity,
  TRow,
  TCreate,
  TUpdate,
  TId = string,
> {
  supabase: SupabaseClientLike<{ data: TRow[] | TRow | null; error: unknown }>;
  config: SupabaseGetAllConfig;
  toEntity: (row: TRow) => TEntity;
  toCreatePayload: (input: TCreate) => Record<string, unknown>;
  toUpdatePayload: (input: TUpdate) => Record<string, unknown>;
  resolveIdColumn?: (id: TId) => { column: string; value: unknown };
}

export const createSupabaseBaseRepository = <
  TEntity,
  TRow,
  TCreate,
  TUpdate,
  TId = string,
>({
  supabase,
  config,
  toEntity,
  toCreatePayload,
  toUpdatePayload,
  resolveIdColumn,
}: CreateSupabaseBaseRepositoryParams<TEntity, TRow, TCreate, TUpdate, TId>): BaseRepository<
  TEntity,
  TCreate,
  TUpdate,
  TId
> => {
  const resolveId = (id: TId) =>
    resolveIdColumn ? resolveIdColumn(id) : { column: 'id', value: id };

  return {
    async create(input) {
      const { data, error } = await resolveSelectResult(supabase
        .from(config.table)
        .insert(toCreatePayload(input))
        .select(config.select));

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        throw new Error(`Missing created row for table ${config.table}`);
      }

      return toEntity(row as TRow);
    },

    async getById(id) {
      const target = resolveId(id);
      const query = supabase.from(config.table).select(config.select).eq(
        target.column,
        target.value
      );

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      return row ? toEntity(row as TRow) : null;
    },

    async getAll(input?: GetAllInput) {
      const query = applyGetAllQuery(supabase.from(config.table), {
        input,
        config,
      });

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return (Array.isArray(data) ? data : []).map((row) => toEntity(row as TRow));
    },

    async update(id, input) {
      const target = resolveId(id);
      const { error } = await supabase
        .from(config.table)
        .update(toUpdatePayload(input))
        .eq(target.column, target.value);

      if (error) {
        throw error;
      }
    },

    async delete(id) {
      const target = resolveId(id);
      const { error } = await supabase
        .from(config.table)
        .delete()
        .eq(target.column, target.value);

      if (error) {
        throw error;
      }
    },
  };
};
