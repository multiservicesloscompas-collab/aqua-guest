import type { Product, ProductDraft } from '@aqua-guest/domain';
import type { BaseRepository } from '../../../shared/domain';

export type ProductsRepository = BaseRepository<
  Product,
  ProductDraft,
  Partial<ProductDraft>
>;
