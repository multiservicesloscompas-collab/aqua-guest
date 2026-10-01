import { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';
import { Expense, PaymentMethod } from '@/types';
import type { ExpenseDraft, ExpenseUpdate } from '@aqua-guest/domain';

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
  expense_payment_splits?: PaymentSplitRow[];
  payment_splits?: PaymentSplitRow[]; // Added for generic compatibility if needed
};

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
