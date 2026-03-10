/**
 * useExpenseStore.ts
 * Thin Zustand store barrel — imports type definitions from .core
 * and helpers from .helpers. All consumers can import from this
 * file and nothing breaks.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense } from '@/types';
import supabase from '@/lib/supabaseClient';
import { expensesDataService } from '@/services/ExpensesDataService';
import {
  enqueueOfflineExpenseCreate,
  enqueueOfflineExpenseDelete,
  enqueueOfflineExpenseUpdate,
} from '@/offline/enqueue/expensesEnqueue';
import { dedupExpensesByDateRange } from './useExpenseStore.helpers';
import {
  type ExpenseState,
  type ExpenseInsertPayload,
  type ExpenseUpdatePayload,
  type ExpenseRow,
} from './useExpenseStore.core';

// Re-export types so existing import paths continue to work
export type {
  ExpenseState,
  ExpenseInsertPayload,
  ExpenseUpdatePayload,
  ExpenseRow,
};

const loadingExpenseRanges = new Set<string>();

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      setExpensesData: (expenses) => set({ expenses }),

      addExpense: async (expense) => {
        try {
          if (!window.navigator.onLine) {
            const createdAt = new Date().toISOString();
            const offlineExpense = enqueueOfflineExpenseCreate(
              expense,
              createdAt
            );
            set((state) => ({ expenses: [...state.expenses, offlineExpense] }));
            expensesDataService.invalidateCache(expense.date);
            return;
          }

          const payload: ExpenseInsertPayload = {
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            payment_method: expense.paymentMethod,
            notes: expense.notes,
          };
          const { data, error } = await supabase
            .from('expenses')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;
          const row = data as ExpenseRow;
          const newExpense: Expense = {
            id: row.id,
            date: row.date,
            description: row.description,
            amount: Number(row.amount),
            category: row.category,
            paymentMethod: row.payment_method || 'efectivo',
            notes: row.notes ?? undefined,
            createdAt: row.created_at || new Date().toISOString(),
          };
          set((state) => ({ expenses: [...state.expenses, newExpense] }));
          expensesDataService.invalidateCache(row.date);
        } catch (err) {
          console.error('Failed to add expense to Supabase', err);
          throw err;
        }
      },

      updateExpense: async (id, updates) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineExpenseUpdate(id, updates);
            set((state) => ({
              expenses: state.expenses.map((exp) =>
                exp.id === id ? { ...exp, ...updates } : exp
              ),
            }));
            const updatedExpense = get().expenses.find((e) => e.id === id);
            if (updatedExpense) {
              expensesDataService.invalidateCache(updatedExpense.date);
              if (updates.date && updates.date !== updatedExpense.date) {
                expensesDataService.invalidateCache(updates.date);
              }
            }
            return;
          }

          const payload: ExpenseUpdatePayload = {};
          if (updates.description !== undefined)
            payload.description = updates.description;
          if (updates.amount !== undefined) payload.amount = updates.amount;
          if (updates.category !== undefined)
            payload.category = updates.category;
          if (updates.paymentMethod !== undefined)
            payload.payment_method = updates.paymentMethod;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.date !== undefined) payload.date = updates.date;

          const { error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates } : exp
            ),
          }));
          const updatedExpense = get().expenses.find((e) => e.id === id);
          if (updatedExpense) {
            expensesDataService.invalidateCache(updatedExpense.date);
            if (updates.date && updates.date !== updatedExpense.date) {
              expensesDataService.invalidateCache(updates.date);
            }
          }
        } catch (err) {
          console.error('Failed to update expense in Supabase', err);
          throw err;
        }
      },

      deleteExpense: async (id) => {
        const expenseToDelete = get().expenses.find((e) => e.id === id);
        try {
          if (!window.navigator.onLine) {
            enqueueOfflineExpenseDelete(id);
            set((state) => ({
              expenses: state.expenses.filter((exp) => exp.id !== id),
            }));
            if (expenseToDelete) {
              expensesDataService.invalidateCache(expenseToDelete.date);
            }
            return;
          }

          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
          }));
          if (expenseToDelete) {
            expensesDataService.invalidateCache(expenseToDelete.date);
          }
        } catch (err) {
          console.error('Failed to delete expense from Supabase', err);
          throw err;
        }
      },

      getExpensesByDate: (date) =>
        get().expenses.filter((exp) => exp.date === date),

      loadExpensesByDate: async (date) => {
        try {
          const expenses = await expensesDataService.loadExpensesByDate(date);
          set((state) => {
            const existingExpenses = state.expenses.filter(
              (e) => e.date !== date
            );
            return { expenses: [...existingExpenses, ...expenses] };
          });
          return expenses;
        } catch (err) {
          console.error('Error loading expenses by date:', err);
          throw err;
        }
      },

      loadExpensesByDates: async (dates) => {
        try {
          const map = await expensesDataService.loadExpensesByDates(dates);
          const incoming: Expense[] = [];
          for (const entries of map.values()) {
            incoming.push(...entries);
          }
          const loadedDatesSet = new Set(dates);
          set((state) => {
            const kept = state.expenses.filter(
              (e) => !loadedDatesSet.has(e.date)
            );
            return { expenses: [...kept, ...incoming] };
          });
        } catch (err) {
          console.error('Error loading expenses by dates:', err);
          throw err;
        }
      },

      loadExpensesByDateRange: async (startDate, endDate) => {
        const rangeKey = `loading_expenses_${startDate}_${endDate}`;
        if (loadingExpenseRanges.has(rangeKey)) return;
        loadingExpenseRanges.add(rangeKey);

        try {
          const dates: string[] = [];
          const current = new Date(startDate + 'T12:00:00');
          const end = new Date(endDate + 'T12:00:00');
          while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
          }

          if (dates.length === 0) return;

          const expensesMap = await expensesDataService.loadExpensesByDateRange(
            startDate,
            endDate
          );
          const allExpenses: Expense[] = [];
          for (const entries of expensesMap.values()) {
            allExpenses.push(...entries);
          }

          const loadedDatesSet = new Set(dates);
          set((state) => ({
            expenses: dedupExpensesByDateRange(
              state.expenses,
              allExpenses,
              loadedDatesSet
            ),
          }));
        } catch (err) {
          console.error('Error loading expenses for date range:', err);
        } finally {
          loadingExpenseRanges.delete(rangeKey);
        }
      },
    }),
    {
      name: 'aquagest-expense-storage',
    }
  )
);
