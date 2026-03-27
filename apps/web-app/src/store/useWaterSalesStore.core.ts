/**
 * useWaterSalesStore.core.ts
 * Type definitions for the water sales Zustand store.
 * No Zustand or Supabase dependencies — pure TypeScript.
 */
import { CartItem, PaymentMethod, Sale } from '@/types';
import type { TipCaptureInput } from '@/types/tips';
import type { PaymentSplit } from '@/types/paymentSplits';

// ─── Row / Insert / Update shapes ────────────────────────────────────────────

export interface SalesRow {
  id: string;
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  payment_splits?: PaymentSplit[];
  total_bs: number;
  total_usd: number;
  exchange_rate: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type SaleInsert = {
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  total_bs: number;
  total_usd: number;
  exchange_rate: number;
  notes?: string;
};

export type SaleUpdate = Partial<{
  payment_method: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  total_bs: number;
  total_usd: number;
  notes?: string;
  items?: CartItem[];
  updated_at: string;
}>;

// ─── State interface ──────────────────────────────────────────────────────────

export interface WaterSalesState {
  sales: Sale[];
  cart: CartItem[];
  loadingSalesByRange: Record<string, boolean>;

  addToCart: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  completeSale: (
    paymentMethod: PaymentMethod,
    selectedDate: string,
    notes?: string,
    paymentSplits?: PaymentSplit[],
    tipInput?: TipCaptureInput
  ) => Promise<Sale>;
  updateSale: (
    id: string,
    updates: Partial<Sale>,
    tipInput?: TipCaptureInput | null
  ) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  getSalesByDate: (date: string) => Sale[];
  loadSalesByDate: (date: string) => Promise<Sale[]>;
  loadSalesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  setSales: (sales: Sale[]) => void;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 15);
