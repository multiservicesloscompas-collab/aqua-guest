import type {
  LiterPricingRepository,
  ProductsRepository,
  SalesRepository,
} from '../../domain';
import type { SupabaseClientLike } from '../../../../shared/infrastructure/supabase';
import { createLiterPricingSupabaseRepository } from './liter-pricing-supabase.repository';
import { createProductsSupabaseRepository } from './products-supabase.repository';
import { createSalesSupabaseRepository } from './sales-supabase.repository';

export interface CreateWaterSalesSupabaseRepositoriesParams {
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>;
}

export interface WaterSalesSupabaseRepositories {
  salesRepository: SalesRepository;
  productsRepository: ProductsRepository;
  literPricingRepository: LiterPricingRepository;
}

export const createWaterSalesSupabaseRepositories = ({
  supabase,
}: CreateWaterSalesSupabaseRepositoriesParams): WaterSalesSupabaseRepositories => ({
  salesRepository: createSalesSupabaseRepository(supabase),
  productsRepository: createProductsSupabaseRepository(supabase),
  literPricingRepository: createLiterPricingSupabaseRepository(supabase),
});
