import type { Customer, CustomerDraft, CustomerUpdate } from '@aqua-guest/domain';
import type { CustomersRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toCustomer,
  toCustomerCreatePayload,
  toCustomerUpdatePayload,
} from './washer-rentals.supabase.mappers';
import type { CustomerRow } from './washer-rentals.supabase.types';

const customersGetAllConfig: SupabaseGetAllConfig = {
  table: 'customers',
  select: 'id, name, phone, address',
  defaultOrderBy: 'name',
  defaultAscending: true,
};

export const createCustomersSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): CustomersRepository =>
  createSupabaseBaseRepository<Customer, CustomerRow, CustomerDraft, CustomerUpdate>({
    supabase: supabase as SupabaseClientLike<{
      data: CustomerRow[] | CustomerRow | null;
      error: unknown;
    }>,
    config: customersGetAllConfig,
    toEntity: toCustomer,
    toCreatePayload: toCustomerCreatePayload,
    toUpdatePayload: toCustomerUpdatePayload,
  });
