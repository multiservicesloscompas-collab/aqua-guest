import type { Expense, ExpenseDraft, ExpenseUpdate } from '@aqua-guest/domain';
import type { ExpensesRepository } from '../../domain';
import {
  PAYMENT_SPLIT_READ_SELECT,
  createSupabaseBaseRepository,
  type SupabaseClientLike,
  type SupabaseGetAllConfig,
} from '../../../shared/infrastructure/supabase';
import {
  toExpense,
  toExpenseCreatePayload,
  toExpenseUpdatePayload,
} from './core.supabase.mappers';
import {
  EXPENSE_PAYMENT_SPLITS_TABLE,
  toExpensePaymentSplitInsertRows,
  type ExpenseRow,
} from './core.supabase.types';

type MutationClient = SupabaseClientLike<{ data: unknown; error: unknown }>;

const expensesGetAllConfig: SupabaseGetAllConfig = {
  table: 'expenses',
  select: [
    'id',
    'date',
    'description',
    'amount',
    'category',
    'paymentMethod:payment_method',
    'notes',
    'createdAt:created_at',
  ].join(', '),
  relationSelects: {
    paymentSplits: `paymentSplits:${EXPENSE_PAYMENT_SPLITS_TABLE}(${PAYMENT_SPLIT_READ_SELECT})`,
  },
  defaultOrderBy: 'created_at',
  defaultAscending: true,
};

const groupExpensesByDate = (
  dates: readonly string[],
  items: readonly Expense[]
): Map<string, Expense[]> => {
  const grouped = new Map<string, Expense[]>();

  for (const date of dates) {
    grouped.set(date, []);
  }

  for (const expense of items) {
    const dateKey = expense.date.substring(0, 10);
    const current = grouped.get(dateKey) ?? [];
    current.push(expense);
    grouped.set(dateKey, current);
  }

  return grouped;
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

const replaceExpensePaymentSplits = async (
  supabase: MutationClient,
  expenseId: string,
  paymentSplits: Expense['paymentSplits']
) => {
  const splitTable = supabase.from(EXPENSE_PAYMENT_SPLITS_TABLE);
  const { error: deleteError } = await splitTable.delete().eq('expense_id', expenseId);
  if (deleteError) {
    throw deleteError;
  }

  if (!paymentSplits?.length) {
    return;
  }

  const { error: insertError } = await splitTable.insert(
    toExpensePaymentSplitInsertRows(expenseId, paymentSplits)
  );

  if (insertError) {
    throw insertError;
  }
};

export const createExpensesSupabaseRepository = (
  supabase: SupabaseClientLike<{ data: unknown; error: unknown }>
): ExpensesRepository => {
  const baseRepository = createSupabaseBaseRepository<
    Expense,
    ExpenseRow,
    ExpenseDraft,
    ExpenseUpdate
  >({
    supabase: supabase as SupabaseClientLike<{
      data: ExpenseRow[] | ExpenseRow | null;
      error: unknown;
    }>,
    config: expensesGetAllConfig,
    toEntity: toExpense,
    toCreatePayload: toExpenseCreatePayload,
    toUpdatePayload: toExpenseUpdatePayload,
  });

  const mutationClient = supabase as MutationClient;

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
        await replaceExpensePaymentSplits(
          mutationClient,
          created.id,
          input.paymentSplits
        );
      } catch (error) {
        await mutationClient.from('expenses').delete().eq('id', created.id);
        throw error;
      }

      return {
        ...created,
        paymentSplits: input.paymentSplits,
      };
    },
    async update(id, input) {
      await baseRepository.update(id, input);
      if (input.paymentSplits !== undefined) {
        await replaceExpensePaymentSplits(mutationClient, id, input.paymentSplits);
      }
    },
    async loadByDate(date) {
      return this.getAll({
        relations: ['paymentSplits'],
        where: { fields: [{ field: 'date', value: date }] },
      });
    },
    async loadByDates(dates) {
      const items = await this.getAll({
        relations: ['paymentSplits'],
        where: { fields: [{ field: 'date', value: [...dates] }] },
      });
      return groupExpensesByDate(dates, items);
    },
    async loadByDateRange(startDate, endDate) {
      const items = await this.getAll({
        relations: ['paymentSplits'],
        where: {
          fields: [
            { field: 'date', value: startDate, operator: '>=' },
            { field: 'date', value: endDate, operator: '<=' },
          ],
        },
      });

      return groupExpensesByDate(buildDateRangeKeys(startDate, endDate), items);
    },
  };
};
