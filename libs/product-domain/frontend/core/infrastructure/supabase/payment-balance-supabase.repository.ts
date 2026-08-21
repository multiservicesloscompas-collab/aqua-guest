import type {
  PaymentBalanceTransaction,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
} from '@aqua-guest/domain';
import type { PaymentBalanceRepository } from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../shared/infrastructure/supabase';
import {
  toPaymentBalanceCreatePayload,
  toPaymentBalanceTransaction,
  toPaymentBalanceUpdatePayload,
} from './core.supabase.mappers';
import type { PaymentBalanceTransactionRow } from './core.supabase.types';

const paymentBalanceGetAllConfig: SupabaseGetAllConfig = {
  table: 'payment_balance_transactions',
  select: [
    'id',
    'date',
    'operationType:operation_type',
    'fromMethod:from_method',
    'toMethod:to_method',
    'amount',
    'amountBs:amount_bs',
    'amountUsd:amount_usd',
    'amountOutBs:amount_out_bs',
    'amountOutUsd:amount_out_usd',
    'amountInBs:amount_in_bs',
    'amountInUsd:amount_in_usd',
    'differenceBs:difference_bs',
    'differenceUsd:difference_usd',
    'notes',
    'createdAt:created_at',
    'updatedAt:updated_at',
  ].join(', '),
  defaultOrderBy: 'created_at',
  defaultAscending: false,
};

export const createPaymentBalanceSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): PaymentBalanceRepository =>
  createSupabaseBaseRepository<
    PaymentBalanceTransaction,
    PaymentBalanceTransactionRow,
    PaymentBalanceTransactionDraft,
    PaymentBalanceTransactionUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: PaymentBalanceTransactionRow[] | PaymentBalanceTransactionRow | null;
      error: unknown;
    }>,
    config: paymentBalanceGetAllConfig,
    toEntity: toPaymentBalanceTransaction,
    toCreatePayload: toPaymentBalanceCreatePayload,
    toUpdatePayload: toPaymentBalanceUpdatePayload,
  });
