import type { Expense } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import type { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';
import type {
  ExpenseRow,
  ExpenseUpdatePayload,
  ExpenseInsertPayload,
} from './useExpenseStore.core';
import { expensePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';

export const dedupExpensesByDateRange = (
  currentItems: Expense[],
  newItems: Expense[],
  datesToExclude: Set<string>
): Expense[] => {
  const map = new Map<string, Expense>();

  currentItems
    .filter((item) => !datesToExclude.has(item.date))
    .forEach((item) => map.set(item.id, item));
  newItems.forEach((item) => map.set(item.id, item));

  return Array.from(map.values());
};

type SupabaseTableApi = {
  insert: (value: unknown) => PromiseLike<{ error: unknown }>;
  delete: () => {
    eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
  };
};

type SupabaseLike = {
  from: (table: string) => SupabaseTableApi;
};

export const toExpenseInsertPayload = (
  expense: Omit<Expense, 'id' | 'createdAt'>
): ExpenseInsertPayload => ({
  date: expense.date,
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  payment_method: expense.paymentMethod,
  notes: expense.notes,
});

export const toExpenseUpdatePayload = (
  updates: Partial<Expense>
): ExpenseUpdatePayload => {
  const payload: ExpenseUpdatePayload = {};
  if (updates.description !== undefined)
    payload.description = updates.description;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.paymentMethod !== undefined)
    payload.payment_method = updates.paymentMethod;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.date !== undefined) payload.date = updates.date;
  return payload;
};

export const mapExpenseRowToExpense = (
  row: ExpenseRow,
  paymentSplits?: PaymentSplit[]
): Expense => ({
  id: row.id,
  date: row.date,
  description: row.description,
  amount: Number(row.amount),
  category: row.category,
  paymentMethod: row.payment_method || 'efectivo',
  paymentSplits,
  notes: row.notes ?? undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

export const insertExpenseSplitsStrict = async (
  supabase: SupabaseLike,
  expenseId: string,
  paymentSplits?: PaymentSplit[]
) => {
  if (!paymentSplits?.length) return;

  const splitRows = expensePaymentSplitAdapter.toInsertRows(
    expenseId,
    paymentSplits
  );
  const { error } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.expensesSplitsTable)
    .insert(splitRows);

  if (error) {
    throw error;
  }
};

export const replaceExpenseSplitsStrict = async (
  supabase: SupabaseLike,
  expenseId: string,
  paymentSplits: PaymentSplit[]
) => {
  const { error: deleteError } = await supabase
    .from(PAYMENT_SPLIT_SCHEMA.expensesSplitsTable)
    .delete()
    .eq('expense_id', expenseId);

  if (deleteError) {
    throw deleteError;
  }

  await insertExpenseSplitsStrict(supabase, expenseId, paymentSplits);
};

type SupabaseSelectEqResult = {
  data: unknown;
  error: unknown;
};

type SupabaseSelectEqBuilder = {
  eq: (column: string, value: string) => PromiseLike<SupabaseSelectEqResult>;
};

type SupabaseUpdateEqBuilder = {
  eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
};

type SupabaseCompensatingTableApi = {
  select: (columns: string) => SupabaseSelectEqBuilder;
  update: (value: unknown) => SupabaseUpdateEqBuilder;
};

export type SupabaseCompensatingLike = SupabaseLike & {
  from: (
    table: string
  ) => SupabaseTableApi & Partial<SupabaseCompensatingTableApi>;
};

export const updateExpenseWithSplitCompensationStrict = async (
  supabase: SupabaseCompensatingLike,
  expenseId: string,
  payload: ExpenseUpdatePayload,
  paymentSplits: PaymentSplit[]
) => {
  const splitsTable = supabase.from(PAYMENT_SPLIT_SCHEMA.expensesSplitsTable);
  const select = (
    splitsTable as SupabaseTableApi & Partial<SupabaseCompensatingTableApi>
  ).select?.('*');

  if (!select) {
    throw new Error('Split compensation failed: missing select API');
  }

  const { data: previousRows, error: previousSplitsError } = await select.eq(
    'expense_id',
    expenseId
  );
  if (previousSplitsError) {
    throw previousSplitsError;
  }

  const previousSplits = expensePaymentSplitAdapter.fromRows(
    (Array.isArray(previousRows) ? previousRows : []) as PaymentSplitRow[]
  );

  await replaceExpenseSplitsStrict(supabase, expenseId, paymentSplits);

  const expensesTable = supabase.from(PAYMENT_SPLIT_SCHEMA.expensesTable);
  const update = (
    expensesTable as SupabaseTableApi & Partial<SupabaseCompensatingTableApi>
  ).update?.(payload);

  if (!update) {
    await replaceExpenseSplitsStrict(supabase, expenseId, previousSplits);
    throw new Error('Split compensation failed: missing update API');
  }

  const { error: updateError } = await update.eq('id', expenseId);
  if (!updateError) {
    return;
  }

  try {
    await replaceExpenseSplitsStrict(supabase, expenseId, previousSplits);
  } catch (rollbackError) {
    const rollbackMessage =
      rollbackError instanceof Error
        ? rollbackError.message
        : String(rollbackError);
    throw new Error(
      `Expense update failed after split replacement and rollback failed: ${rollbackMessage}`
    );
  }

  throw updateError;
};
