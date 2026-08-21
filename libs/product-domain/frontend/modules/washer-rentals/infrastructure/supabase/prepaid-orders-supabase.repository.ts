import type {
  PrepaidOrder,
  PrepaidOrderDraft,
  PrepaidOrderUpdate,
} from '@aqua-guest/domain';
import type { PrepaidOrdersRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toPrepaidOrder,
  toPrepaidOrderCreatePayload,
  toPrepaidOrderUpdatePayload,
} from './washer-rentals.supabase.mappers';
import type { PrepaidOrderRow } from './washer-rentals.supabase.types';

const prepaidOrdersGetAllConfig: SupabaseGetAllConfig = {
  table: 'prepaid_orders',
  select: [
    'id',
    'customerName:customer_name',
    'customerPhone:customer_phone',
    'liters',
    'amountBs:amount_bs',
    'amountUsd:amount_usd',
    'exchangeRate:exchange_rate',
    'paymentMethod:payment_method',
    'status',
    'datePaid:date_paid',
    'dateDelivered:date_delivered',
    'notes',
    'createdAt:created_at',
    'updatedAt:updated_at',
  ].join(', '),
  defaultOrderBy: 'created_at',
  defaultAscending: false,
};

export const createPrepaidOrdersSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): PrepaidOrdersRepository =>
  createSupabaseBaseRepository<
    PrepaidOrder,
    PrepaidOrderRow,
    PrepaidOrderDraft,
    PrepaidOrderUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: PrepaidOrderRow[] | PrepaidOrderRow | null;
      error: unknown;
    }>,
    config: prepaidOrdersGetAllConfig,
    toEntity: toPrepaidOrder,
    toCreatePayload: toPrepaidOrderCreatePayload,
    toUpdatePayload: toPrepaidOrderUpdatePayload,
  });
