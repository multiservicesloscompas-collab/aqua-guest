import { CartItem, PaymentMethod, Sale } from '@/types';
import type { TipCaptureInput } from '@/types/tips';
import type { CartItemDraft, PaymentSplit } from '@aqua-guest/domain';

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
