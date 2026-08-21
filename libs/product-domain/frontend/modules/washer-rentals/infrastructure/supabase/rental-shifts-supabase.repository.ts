import type {
  RentalShiftConfig,
  RentalShiftConfigDraft,
  RentalShiftConfigUpdate,
} from '@aqua-guest/domain';
import type { RentalShiftsRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toRentalShift,
  toRentalShiftCreatePayload,
  toRentalShiftUpdatePayload,
} from './washer-rentals.supabase.mappers';
import type { RentalShiftRow } from './washer-rentals.supabase.types';

const rentalShiftsGetAllConfig: SupabaseGetAllConfig = {
  table: 'rental_shifts',
  select: [
    'id',
    'label',
    'priceUsd:price_usd',
    'hours',
    'hasDivisaDiscount:has_divisa_discount',
    'divisaDiscountAmount:divisa_discount_amount',
    'isActive:is_active',
    'createdAt:created_at',
    'updatedAt:updated_at',
  ].join(', '),
  defaultOrderBy: 'label',
  defaultAscending: true,
};

export const createRentalShiftsSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): RentalShiftsRepository =>
  createSupabaseBaseRepository<
    RentalShiftConfig,
    RentalShiftRow,
    RentalShiftConfigDraft,
    RentalShiftConfigUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: RentalShiftRow[] | RentalShiftRow | null;
      error: unknown;
    }>,
    config: rentalShiftsGetAllConfig,
    toEntity: toRentalShift,
    toCreatePayload: toRentalShiftCreatePayload,
    toUpdatePayload: toRentalShiftUpdatePayload,
  });
