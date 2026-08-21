import type { Tip } from '@aqua-guest/domain';
import type {
  TipDailyPayoutRequest,
  TipSinglePayoutRequest,
  TipsRepository,
} from '../../domain';
import {
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../shared/infrastructure/supabase';
import { toTip, toTipUpdatePayload, toTipUpsertPayload } from './core.supabase.mappers';
import type { TipAmountRow, TipRow } from './core.supabase.types';

type TipWriteClient = SupabaseClientLike<{ data: unknown; error: unknown }> & {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: TipRow[] | null; error: unknown }>;
    insert(value: unknown): {
      select(columns: string):
        | PromiseLike<{ data: TipRow[] | TipRow | null; error: unknown }>
        | {
            single(): PromiseLike<{
              data: TipRow[] | TipRow | null;
              error: unknown;
            }>;
          };
    };
    update(value: Record<string, unknown>): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): { select(columns: string): PromiseLike<{ data: TipAmountRow[] | TipRow[] | null; error: unknown }> };
        select(columns: string):
          | PromiseLike<{ data: TipRow[] | null; error: unknown }>
          | { single(): PromiseLike<{ data: TipRow[] | TipRow | null; error: unknown }> };
      };
    };
    delete(): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): PromiseLike<{ error: unknown }>;
      };
    };
    upsert(value: unknown, options: { onConflict: string }): {
      select(columns: string):
        | PromiseLike<{ data: TipRow[] | null; error: unknown }>
        | { single(): PromiseLike<{ data: TipRow[] | TipRow | null; error: unknown }> };
    };
  };
};

const resolveTipWriteResult = async <TResult extends { data: unknown; error: unknown }>(
  query: PromiseLike<TResult> & { single?: () => PromiseLike<TResult> }
): Promise<TResult> => {
  if (query.single) {
    return await query.single();
  }

  return await query;
};

const tipsGetAllConfig: SupabaseGetAllConfig = {
  table: 'tips',
  select: [
    'id',
    'originType:origin_type',
    'originId:origin_id',
    'tipDate:tip_date',
    'amountBs:amount_bs',
    'amountUsd:amount_usd',
    'exchangeRateUsed:exchange_rate_used',
    'capturePaymentMethod:capture_payment_method',
    'status',
    'paidPaymentMethod:paid_payment_method',
    'paidAt:paid_at',
    'notes',
    'createdAt:created_at',
    'updatedAt:updated_at',
  ].join(', '),
  defaultOrderBy: 'created_at',
  defaultAscending: true,
};

const ensureIdempotencyKey = (idempotencyKey: string) => {
  if (!idempotencyKey.trim()) {
    throw new Error('idempotency key requerido');
  }
};

const summarizePayoutRows = (
  rows: readonly TipAmountRow[],
  fallbackDate: string,
  paymentMethod: Tip['capturePaymentMethod']
) => ({
  date: rows[0]?.tipDate ?? rows[0]?.tip_date ?? fallbackDate,
  paymentMethod,
  paidCount: rows.length,
  totalAmountBs: rows.reduce(
    (sum, row) => sum + Number(row.amountBs ?? row.amount_bs ?? 0),
    0
  ),
});

export const createTipsSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): TipsRepository => {
  const baseRepository = createSupabaseBaseRepository<Tip, TipRow, Parameters<TipsRepository['upsertByOrigin']>[0], Partial<Parameters<TipsRepository['upsertByOrigin']>[0]>>({
    supabase: supabase as SupabaseClientLike<{
      data: TipRow[] | TipRow | null;
      error: unknown;
    }>,
    config: tipsGetAllConfig,
    toEntity: toTip,
    toCreatePayload: toTipUpsertPayload,
    toUpdatePayload: toTipUpdatePayload,
  });

  const tipClient = supabase as TipWriteClient;

  return {
    ...baseRepository,
    async upsertByOrigin(input) {
      const table = tipClient.from('tips');
      if (!table.upsert) {
        throw new Error('Supabase client does not support tip upsert');
      }

      const { data, error } = await resolveTipWriteResult(table.upsert(toTipUpsertPayload(input), {
          onConflict: 'origin_type,origin_id',
        })
        .select(tipsGetAllConfig.select));

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        throw new Error('Missing tip row after origin upsert');
      }

      return toTip(row);
    },
    async deleteByOrigin(originType, originId) {
      const { error } = await tipClient
        .from('tips')
        .delete()
        .eq('origin_type', originType)
        .eq('origin_id', originId);

      if (error) {
        throw error;
      }
    },
    async updateNote(tipId, notes) {
      const { data, error } = await resolveTipWriteResult(tipClient
        .from('tips')
        .update({ notes: notes?.trim() ? notes.trim() : null })
        .eq('id', tipId)
        .select(tipsGetAllConfig.select));

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        throw new Error('Missing tip row after note update');
      }

      return toTip(row);
    },
    async payForDay(input: TipDailyPayoutRequest) {
      ensureIdempotencyKey(input.idempotencyKey);
      const { data, error } = await tipClient
        .from('tips')
        .update({
          status: 'paid',
          paid_payment_method: input.paymentMethod,
          paid_at: input.paidAt ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('tip_date', input.tipDate)
        .eq('status', 'pending')
        .select('tipDate:tip_date, amountBs:amount_bs');

      if (error) {
        throw error;
      }

      return summarizePayoutRows(
        Array.isArray(data) ? (data as TipAmountRow[]) : [],
        input.tipDate,
        input.paymentMethod
      );
    },
    async paySingle(input: TipSinglePayoutRequest) {
      ensureIdempotencyKey(input.idempotencyKey);
      const { data, error } = await tipClient
        .from('tips')
        .update({
          status: 'paid',
          paid_payment_method: input.paymentMethod,
          paid_at: input.paidAt ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.tipId)
        .eq('status', 'pending')
        .select('tipDate:tip_date, amountBs:amount_bs');

      if (error) {
        throw error;
      }

      return summarizePayoutRows(
        Array.isArray(data) ? (data as TipAmountRow[]) : [],
        input.tipDate ?? '',
        input.paymentMethod
      );
    },
    loadByDateRange(startDate, endDate) {
      return this.getAll({
        where: {
          fields: [
            { field: 'tip_date', value: startDate, operator: '>=' },
            { field: 'tip_date', value: endDate, operator: '<=' },
          ],
        },
      });
    },
    loadPaidByDateRange(startDate, endDate) {
      return this.getAll({
        where: {
          fields: [
            { field: 'status', value: 'paid' },
            { field: 'paid_at', value: `${startDate}T00:00:00Z`, operator: '>=' },
            { field: 'paid_at', value: `${endDate}T23:59:59Z`, operator: '<=' },
          ],
        },
      });
    },
  };
};
