import type { ExpenseCategory, PaymentMethod } from '@aqua-guest/domain';
import type { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';

export type ExpenseInsertRow = {
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  notes?: string;
};

export type ExpenseUpdateRow = Partial<ExpenseInsertRow>;

export type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  category: ExpenseCategory;
  payment_method?: PaymentMethod;
  notes?: string | null;
  created_at?: string;
  expense_payment_splits?: PaymentSplitRow[];
  payment_splits?: PaymentSplitRow[];
};

/** Read shape used by `ExpensesDataService`; also accepts camelCase `createdAt`. */
export type ExpenseReadRow = Omit<ExpenseRow, 'notes'> & {
  notes?: string;
  createdAt?: string;
};
