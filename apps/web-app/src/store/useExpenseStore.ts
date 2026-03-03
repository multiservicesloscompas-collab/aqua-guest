import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, PaymentMethod } from '@/types';
import supabase from '@/lib/supabaseClient';
import { expensesDataService } from '@/services/ExpensesDataService';

interface ExpenseState {
  expenses: Expense[];

  // Acciones de egresos
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDate: (date: string) => Expense[];
  loadExpensesByDate: (date: string) => Promise<Expense[]>;
  loadExpensesByDates: (dates: string[]) => Promise<void>;
  loadExpensesByDateRange: (
    startDate: string,
    endDate: string
  ) => Promise<void>;

  // Inicialización o carga compartida
  setExpensesData: (expenses: Expense[]) => void;
}

type ExpenseInsertPayload = {
  date: string;
  description: string;
  amount: number;
  category: Expense['category'];
  payment_method: PaymentMethod;
  notes?: string;
};

type ExpenseUpdatePayload = {
  description?: string;
  amount?: number;
  category?: Expense['category'];
  payment_method?: PaymentMethod;
  notes?: string;
  date?: string;
};

type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Expense['category'];
  payment_method?: PaymentMethod;
  notes?: string | null;
  created_at?: string;
};

const loadingExpenseRanges = new Set<string>();

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      setExpensesData: (expenses) => {
        set({
          expenses,
        });
      },

      addExpense: async (expense) => {
        try {
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
          set((state) => ({
            expenses: [...state.expenses, newExpense],
          }));
          expensesDataService.invalidateCache(row.date);
        } catch (err) {
          console.error('Failed to add expense to Supabase', err);
          throw err;
        }
      },

      updateExpense: async (id, updates) => {
        try {
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
            return {
              expenses: [...existingExpenses, ...expenses],
            };
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
            return {
              expenses: [...kept, ...incoming],
            };
          });
        } catch (err) {
          console.error('Error loading expenses by dates:', err);
          throw err;
        }
      },

      loadExpensesByDateRange: async (startDate: string, endDate: string) => {
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

          const dedupItems = <T extends { id: string; date: string }>(
            currentItems: T[],
            newItems: T[],
            datesToExclude: Set<string>
          ): T[] => {
            const map = new Map<string, T>();
            currentItems
              .filter((item) => !datesToExclude.has(item.date))
              .forEach((item) => map.set(item.id, item));
            newItems.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          };

          const loadedDatesSet = new Set(dates);

          set((state) => ({
            expenses: dedupItems(state.expenses, allExpenses, loadedDatesSet),
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
