import type { PaymentMethod, PaymentSplit } from '../core/payments';

export interface Product {
  id: string;
  name: string;
  defaultPrice: number;
  requiresLiters: boolean;
  minLiters?: number;
  maxLiters?: number;
}

export type ProductDraft = Omit<Product, 'id'>;

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  liters?: number;
  unitPrice: number;
  subtotal: number;
}

export type CartItemDraft = Omit<CartItem, 'id' | 'subtotal'>;

export interface Sale {
  id: string;
  dailyNumber: number;
  date: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  totalBs: number;
  totalUsd: number;
  exchangeRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SaleLabelReference = Pick<Sale, 'dailyNumber'>;

export type SaleReference = Pick<Sale, 'id' | 'dailyNumber'>;

export type SaleDraft = Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>;
