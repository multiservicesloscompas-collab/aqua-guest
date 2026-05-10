import type {
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseUpdate,
  PaymentMethod,
} from '@aqua-guest/domain';
import { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';

export type ExpenseInsertPayload = {
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  // TODO: do not use snake_case!
  payment_method: PaymentMethod;
  notes?: string;
};

export type ExpenseUpdatePayload = {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  // TODO: do not use snake_case!
  payment_method?: PaymentMethod;
  notes?: string;
  date?: string;
};

export type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  payment_method?: PaymentMethod;
  notes?: string | null;
  created_at?: string;
  expense_payment_splits?: PaymentSplitRow[];
  // TODO: do not use snake_case!
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
