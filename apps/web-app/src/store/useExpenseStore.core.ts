/**
 * useExpenseStore.core.ts
 * Type definitions for the expense Zustand store.
 * No Zustand or Supabase dependencies — pure TypeScript.
 */
import { Expense, PaymentMethod } from '@/types';

// ─── Row / Insert / Update shapes ────────────────────────────────────────────

export type ExpenseInsertPayload = {
  date: string;
  description: string;
  amount: number;
  category: Expense['category'];
  payment_method: PaymentMethod;
  notes?: string;
};

export type ExpenseUpdatePayload = {
  description?: string;
  amount?: number;
  category?: Expense['category'];
  payment_method?: PaymentMethod;
  notes?: string;
  date?: string;
};

export type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Expense['category'];
  payment_method?: PaymentMethod;
  notes?: string | null;
  created_at?: string;
};

// ─── State interface ──────────────────────────────────────────────────────────

export interface ExpenseState {
  expenses: Expense[];

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

  setExpensesData: (expenses: Expense[]) => void;
}
