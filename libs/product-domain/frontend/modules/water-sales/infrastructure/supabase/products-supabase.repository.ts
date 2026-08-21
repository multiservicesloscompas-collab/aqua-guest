import type { Product, ProductDraft } from '@aqua-guest/domain';
import type { ProductsRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toProduct,
  toProductCreatePayload,
  toProductUpdatePayload,
} from './water-sales.supabase.mappers';
import type { ProductRow } from './water-sales.supabase.types';

const productsGetAllConfig: SupabaseGetAllConfig = {
  table: 'products',
  select: [
    'id',
    'name',
    'defaultPrice:default_price',
    'requiresLiters:requires_liters',
    'minLiters:min_liters',
    'maxLiters:max_liters',
  ].join(', '),
  defaultOrderBy: 'name',
  defaultAscending: true,
};

export const createProductsSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): ProductsRepository =>
  createSupabaseBaseRepository<Product, ProductRow, ProductDraft, Partial<ProductDraft>>({
    supabase: supabase as SupabaseClientLike<{
      data: ProductRow[] | ProductRow | null;
      error: unknown;
    }>,
    config: productsGetAllConfig,
    toEntity: toProduct,
    toCreatePayload: toProductCreatePayload,
    toUpdatePayload: toProductUpdatePayload,
  });
