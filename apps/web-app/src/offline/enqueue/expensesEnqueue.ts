import type { Expense } from '@/types';
import { useSyncStore } from '@/store/useSyncStore';

type ExpenseCreateInput = Omit<Expense, 'id' | 'createdAt'>;
type ExpenseUpdateInput = Partial<Omit<Expense, 'id' | 'createdAt'>>;

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

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'expenses',
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

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'expenses',
    payload: {
      id,
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
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineExpenseDelete = (
  id: string,
  actionSource = 'expenses/deleteExpense'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'expenses',
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
