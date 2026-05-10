import type {
  CartItem,
  CartItemDraft,
  PaymentMethod,
  PaymentSplit,
  Sale,
} from '@aqua-guest/domain';
import type { TipCaptureInput } from '@/types/tips';

export interface SalesRow {
  id: string;
  // TODO: do not use snake_case!
  daily_number: number;
  date: string;
  items: CartItem[];
  // TODO: do not use snake_case!
  payment_method: PaymentMethod;
  // TODO: do not use snake_case!
  payment_splits?: PaymentSplit[];
  // TODO: do not use snake_case!;
  total_bs: number;
  // TODO: do not use snake_case!
  total_usd: number;
  // TODO: do not use snake_case!
  exchange_rate: number;
  notes?: string | null;
  // TODO: do not use snake_case!
  created_at?: string | null;
  // TODO: do not use snake_case!
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

  addToCart: (item: CartItemDraft) => void;
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
