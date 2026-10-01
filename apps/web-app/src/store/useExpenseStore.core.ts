import { Expense } from '@/types';
import type { ExpenseDraft, ExpenseUpdate } from '@aqua-guest/domain';

// ─── State interface ──────────────────────────────────────────────────────────

export interface ExpenseState {
  expenses: Expense[];

  addExpense: (expense: ExpenseDraft) => Promise<void>;
  updateExpense: (id: string, updates: ExpenseUpdate) => Promise<void>;
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
