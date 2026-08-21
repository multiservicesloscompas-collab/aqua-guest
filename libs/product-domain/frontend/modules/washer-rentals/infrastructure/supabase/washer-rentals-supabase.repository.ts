import type { WasherRental, WasherRentalDraft, WasherRentalUpdate } from '@aqua-guest/domain';
import type { WasherRentalsRepository } from '../../domain';
import {
  PAYMENT_SPLIT_READ_SELECT,
  createSupabaseBaseRepository,
  toPaymentSplitInsertRows,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../../shared/infrastructure/supabase';
import {
  toWasherRental,
  toWasherRentalCreatePayload,
  toWasherRentalUpdatePayload,
} from './washer-rentals.supabase.mappers';
import {
  RENTAL_PAYMENT_SPLITS_TABLE,
  type WasherRentalRow,
} from './washer-rentals.supabase.types';

type ReadClient = SupabaseClientLike<{ data: unknown; error: unknown }> & {
  from(table: string): {
    select(columns: string): {
      lte(column: string, value: string): {
        gte(column: string, value: string): PromiseLike<{
          data: WasherRentalRow[] | null;
          error: unknown;
        }>;
      };
      or(condition: string): {
        order(
          column: string,
          options?: { ascending?: boolean }
        ): PromiseLike<{ data: WasherRentalRow[] | null; error: unknown }>;
      };
    };
    delete(): {
      eq(column: string, value: string): PromiseLike<{ error: unknown }>;
    };
    insert(value: unknown): PromiseLike<{ error: unknown }>;
  };
};

const RENTALS_SELECT = [
  'id',
  'date',
  'customerId:customer_id',
  'machineId:machine_id',
  'shift',
  'deliveryTime:delivery_time',
  'pickupTime:pickup_time',
  'pickupDate:pickup_date',
  'deliveryFee:delivery_fee',
  'totalUsd:total_usd',
  'paymentMethod:payment_method',
  'status',
  'isPaid:is_paid',
  'datePaid:date_paid',
  'notes',
  'createdAt:created_at',
  'updatedAt:updated_at',
  'customers(name, phone, address)',
].join(', ');

const rentalsGetAllConfig: SupabaseGetAllConfig = {
  table: 'washer_rentals',
  select: RENTALS_SELECT,
  relationSelects: {
    paymentSplits: `paymentSplits:${RENTAL_PAYMENT_SPLITS_TABLE}(${PAYMENT_SPLIT_READ_SELECT})`,
  },
  defaultOrderBy: 'created_at',
  defaultAscending: true,
};

const buildDateRangeKeys = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const groupByServiceDate = (
  dates: readonly string[],
  rentals: readonly WasherRental[]
): Map<string, WasherRental[]> => {
  const grouped = new Map<string, WasherRental[]>();

  for (const date of dates) {
    grouped.set(date, []);
  }

  for (const rental of rentals) {
    const dateKey = rental.date.substring(0, 10);
    const current = grouped.get(dateKey) ?? [];
    current.push(rental);
    grouped.set(dateKey, current);
  }

  return grouped;
};

const replaceRentalPaymentSplits = async (
  supabase: ReadClient,
  rentalId: string,
  paymentSplits: WasherRental['paymentSplits']
) => {
  const table = supabase.from(RENTAL_PAYMENT_SPLITS_TABLE);
  const { error: deleteError } = await table.delete().eq('rental_id', rentalId);
  if (deleteError) {
    throw deleteError;
  }

  if (!paymentSplits?.length) {
    return;
  }

  const { error: insertError } = await table.insert(
    toPaymentSplitInsertRows('rental_id', rentalId, paymentSplits)
  );
  if (insertError) {
    throw insertError;
  }
};

export const createWasherRentalsSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): WasherRentalsRepository => {
  const baseRepository = createSupabaseBaseRepository<
    WasherRental,
    WasherRentalRow,
    WasherRentalDraft,
    WasherRentalUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: WasherRentalRow[] | WasherRentalRow | null;
      error: unknown;
    }>,
    config: rentalsGetAllConfig,
    toEntity: toWasherRental,
    toCreatePayload: toWasherRentalCreatePayload,
    toUpdatePayload: toWasherRentalUpdatePayload,
  });

  const readClient = supabase as ReadClient;

  return {
    ...baseRepository,
    getAll: (input) =>
      baseRepository.getAll({
        ...input,
        relations: input?.relations ?? ['paymentSplits'],
      }),
    async create(input) {
      const created = await baseRepository.create(input);
      try {
        await replaceRentalPaymentSplits(readClient, created.id, input.paymentSplits);
      } catch (error) {
        try {
          await baseRepository.delete(created.id);
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            'Failed to persist rental payment splits and rollback the created rental'
          );
        }

        throw error;
      }

      return {
        ...created,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        paymentSplits: input.paymentSplits,
      };
    },
    async update(id, input) {
      await baseRepository.update(id, input);
      if (input.paymentSplits !== undefined) {
        await replaceRentalPaymentSplits(readClient, id, input.paymentSplits);
      }
    },
    loadByDate(date) {
      return this.getAll({
        relations: ['paymentSplits'],
        where: {
          fields: [
            { field: 'date', value: date, operator: '<=' },
            { field: 'pickup_date', value: date, operator: '>=' },
          ],
        },
      });
    },
    async loadByDates(dates) {
      const grouped = new Map<string, WasherRental[]>();
      await Promise.all(
        dates.map(async (date) => {
          grouped.set(date, await this.loadByDate(date));
        })
      );
      return grouped;
    },
    async loadByDateRange(startDate, endDate) {
      const rentalsTable = readClient.from('washer_rentals');
      const rentalsSelect = rentalsTable.select(
        `${RENTALS_SELECT}, paymentSplits:${RENTAL_PAYMENT_SPLITS_TABLE}(${PAYMENT_SPLIT_READ_SELECT})`
      ) as unknown as {
        or(condition: string): {
          order(
            column: string,
            options?: { ascending?: boolean }
          ): PromiseLike<{ data: WasherRentalRow[] | null; error: unknown }>;
        };
      };

      const { data, error } = await rentalsSelect
        .or(
          `and(date.gte.${startDate},date.lte.${endDate}),and(date_paid.gte.${startDate},date_paid.lte.${endDate})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const rentals = (data ?? []).map((row: WasherRentalRow) =>
        toWasherRental(row as WasherRentalRow)
      );

      return groupByServiceDate(buildDateRangeKeys(startDate, endDate), rentals);
    },
  };
};
