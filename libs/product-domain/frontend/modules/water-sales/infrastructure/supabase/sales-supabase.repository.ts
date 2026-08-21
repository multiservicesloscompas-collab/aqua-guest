import type { Sale, SaleDraft } from '@aqua-guest/domain';
import type { SalesRepository } from '../../domain';
import type { GetAllInput } from '../../../../shared/domain';
import {
  PAYMENT_SPLIT_READ_SELECT,
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toSale,
  toSaleCreatePayload,
  toSaleUpdatePayload,
} from './water-sales.supabase.mappers';
import type { SaleRow } from './water-sales.supabase.types';
import {
  SALES_PAYMENT_SPLITS_TABLE,
  toSalePaymentSplitInsertRows,
} from './water-sales.supabase.types';

const SALES_SELECT = [
  'id',
  'dailyNumber:daily_number',
  'date',
  'items',
  'paymentMethod:payment_method',
  'totalBs:total_bs',
  'totalUsd:total_usd',
  'exchangeRate:exchange_rate',
  'notes',
  'createdAt:created_at',
  'updatedAt:updated_at',
].join(', ');

const salesGetAllConfig: SupabaseGetAllConfig = {
  table: 'sales',
  select: SALES_SELECT,
  relationSelects: {
    paymentSplits: `paymentSplits:${SALES_PAYMENT_SPLITS_TABLE}(${PAYMENT_SPLIT_READ_SELECT})`,
  },
  defaultOrderBy: 'created_at',
  defaultAscending: true,
};

const replaceSalePaymentSplits = async (
  supabase: SupabaseClientLike<{ data: null; error: unknown }>,
  saleId: string,
  paymentSplits: Sale['paymentSplits']
) => {
  const splitTable = supabase.from(SALES_PAYMENT_SPLITS_TABLE);
  const { error: deleteError } = await splitTable.delete().eq('sale_id', saleId);

  if (deleteError) {
    throw deleteError;
  }

  if (!paymentSplits?.length) {
    return;
  }

  const { error: insertError } = await splitTable.insert(
    toSalePaymentSplitInsertRows(saleId, paymentSplits)
  );

  if (insertError) {
    throw insertError;
  }
};

export const createSalesSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): SalesRepository => {
  const baseRepository = createSupabaseBaseRepository<
    Sale,
    SaleRow,
    SaleDraft,
    Partial<SaleDraft>
  >({
    supabase: supabase as SupabaseClientLike<{
      data: SaleRow[] | SaleRow | null;
      error: unknown;
    }>,
    config: salesGetAllConfig,
    toEntity: (row) => toSale(row),
    toCreatePayload: toSaleCreatePayload,
    toUpdatePayload: toSaleUpdatePayload,
  });

  const salesSplitClient = supabase as SupabaseClientLike<{
    data: null;
    error: unknown;
  }>;

  const getAll = (input?: GetAllInput): Promise<Sale[]> =>
    baseRepository.getAll({
      ...input,
      relations: input?.relations ?? ['paymentSplits'],
    });

  return {
    ...baseRepository,
    getAll,
    loadByDate: (date) =>
      getAll({ where: { fields: [{ field: 'date', value: date }] } }),
    async loadByDates(dates) {
      const items = await getAll({
        where: {
          fields: [{ field: 'date', value: [...dates] }],
        },
      });

      const grouped = new Map<string, Sale[]>();
      for (const date of dates) {
        grouped.set(date, []);
      }

      for (const sale of items) {
        const dateKey = sale.date.substring(0, 10);
        const current = grouped.get(dateKey) ?? [];
        current.push(sale);
        grouped.set(dateKey, current);
      }

      return grouped;
    },
    async loadByDateRange(startDate, endDate) {
      const items = await getAll({
        where: {
          fields: [
            { field: 'date', value: startDate, operator: '>=' },
            { field: 'date', value: endDate, operator: '<=' },
          ],
        },
      });

      const grouped = new Map<string, Sale[]>();
      for (const sale of items) {
        const dateKey = sale.date.substring(0, 10);
        const current = grouped.get(dateKey) ?? [];
        current.push(sale);
        grouped.set(dateKey, current);
      }

      return grouped;
    },
    async create(input) {
      const created = await baseRepository.create(input);
      try {
        await replaceSalePaymentSplits(
          salesSplitClient,
          created.id,
          input.paymentSplits
        );
      } catch (error) {
        try {
          await baseRepository.delete(created.id);
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            'Failed to persist sale payment splits and rollback the created sale'
          );
        }

        throw error;
      }

      return {
        ...created,
        paymentMethod: input.paymentMethod,
        paymentSplits: input.paymentSplits,
      };
    },
    async update(id, input) {
      await baseRepository.update(id, input);

      if (input.paymentSplits !== undefined) {
        await replaceSalePaymentSplits(salesSplitClient, id, input.paymentSplits);
      }
    },
  };
};
