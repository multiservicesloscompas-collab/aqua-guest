import type {
  Expense,
  ExpenseDraft,
  ExpenseUpdate,
  PaymentSplit,
} from '@aqua-guest/domain';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import { expensePaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import {
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryMutation,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

type ExpenseCreateInput = ExpenseDraft;
type ExpenseUpdateInput = ExpenseUpdate;

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `expense:${id}`;

export const enqueueOfflineExpenseCreate = (
  expense: ExpenseCreateInput,
  createdAt: string,
  actionSource = 'expenses/addExpense'
): Expense => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  enqueueOfflineRepositoryCreate({
    table: 'expenses',
    repository: 'expenses',
    input: {
      tempId,
      ...expense,
    },
    payload: {
      tempId,
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      payment_method: expense.paymentMethod,
      notes: expense.notes,
    },
    enqueueSource: actionSource,
    businessKey,
  });

  if (expense.paymentSplits?.length) {
    enqueueOfflineRepositoryMutation({
      type: 'UPDATE',
      table: PAYMENT_SPLIT_SCHEMA.expensesSplitsTable,
      repository: 'expenses',
      operation: 'update',
      input: {
        id: tempId,
        updates: { paymentSplits: expense.paymentSplits },
      },
      payload: { id: tempId },
      enqueueSource: actionSource,
      businessKey: `expense-splits:${tempId}`,
      dependencyKeys: [businessKey],
    });
  }

  return {
    id: tempId,
    ...expense,
    createdAt,
  };
};

export const enqueueOfflineExpenseUpdate = (
  id: string,
  updates: ExpenseUpdateInput,
  actionSource = 'expenses/updateExpense'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryUpdate({
    table: 'expenses',
    repository: 'expenses',
    id,
    updates,
    payload: {
      ...(updates.description !== undefined
        ? { description: updates.description }
        : {}),
      ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.paymentMethod !== undefined
        ? { payment_method: updates.paymentMethod }
        : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.date !== undefined ? { date: updates.date } : {}),
    },
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineExpenseDelete = (
  id: string,
  actionSource = 'expenses/deleteExpense'
) => {
  const businessKey = buildEntityBusinessKey(id);

  enqueueOfflineRepositoryDelete({
    table: 'expenses',
    repository: 'expenses',
    id,
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineExpensePaymentSplitsReplace = (
  expenseId: string,
  splits: PaymentSplit[],
  actionSource = 'expenses/updateExpense'
) => {
  const businessKey = `expense-splits:${expenseId}`;

  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table: PAYMENT_SPLIT_SCHEMA.expensesSplitsTable,
    repository: 'expenses',
    operation: 'update',
    input: {
      id: expenseId,
      updates: { paymentSplits: splits },
    },
    payload: {
      id: expenseId,
      splits: expensePaymentSplitAdapter.toInsertRows(expenseId, splits),
      __legacyRepositorySemantic: true,
    },
    enqueueSource: actionSource,
    businessKey,
  });
};
