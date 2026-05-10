import type { PaymentMethod, PaymentSplit } from './payments';

export type ExpenseCategory =
  | 'operativo'
  | 'insumos'
  | 'servicios'
  | 'mantenimiento'
  | 'personal'
  | 'otros';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  notes?: string;
  createdAt: string;
}

export interface LiterPricing {
  breakpoint: number;
  price: number;
}

export interface ExchangeRateHistory {
  date: string;
  rate: number;
  updatedAt: string;
}

export type TipOriginType = 'sale' | 'rental';

export interface TipOriginReference {
  originType: TipOriginType;
  originId: string;
}

export type ExpenseDraft = Omit<Expense, 'id' | 'createdAt'>;
export type ExpenseUpdate = Partial<ExpenseDraft>;
