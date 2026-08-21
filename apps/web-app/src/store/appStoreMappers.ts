import type { PaymentMethod, Product } from '@aqua-guest/domain';
import type { ProductWithIcon, Tip } from '@/types';

type ProductRow = {
  id: string;
  name: string;
  default_price: number | string;
  requires_liters: boolean;
  minLiters?: number | null;
  max_liters?: number | null;
  icon?: string | null;
};

type LiterPricingRow = {
  breakpoint: number | string;
  price: number | string;
};

type TipRow = {
  id: string;
  origin_type: Tip['originType'];
  origin_id: string;
  tip_date: string;
  amount_bs: number | string;
  amount_usd: number | string | null;
  exchange_rate_used: number | string | null;
  capture_payment_method: PaymentMethod;
  status: Tip['status'];
  paid_payment_method: PaymentMethod | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const mapProducts = (rows: ProductRow[]): ProductWithIcon[] =>
  rows.map((product) => {
    const baseProduct: Product = {
      id: product.id,
      name: product.name,
      defaultPrice: Number(product.default_price),
      requiresLiters: product.requires_liters,
      minLiters: product.minLiters ?? undefined,
      maxLiters: product.max_liters ?? undefined,
    };

    return {
      ...baseProduct,
      icon: product.icon ?? undefined,
    };
  });

export const mapLiterPricing = (rows: LiterPricingRow[]) =>
  rows.map((pricing) => ({
    breakpoint: Number(pricing.breakpoint),
    price: Number(pricing.price),
  }));

export const mapTips = (rows: TipRow[]): Tip[] =>
  rows.map((tip) => ({
    id: tip.id,
    originType: tip.origin_type,
    originId: tip.origin_id,
    tipDate: tip.tip_date,
    amountBs: Number(tip.amount_bs),
    amountUsd: tip.amount_usd !== null ? Number(tip.amount_usd) : undefined,
    exchangeRateUsed:
      tip.exchange_rate_used !== null
        ? Number(tip.exchange_rate_used)
        : undefined,
    capturePaymentMethod: tip.capture_payment_method,
    status: tip.status,
    paidPaymentMethod: tip.paid_payment_method ?? undefined,
    paidAt: tip.paid_at ?? undefined,
    notes: tip.notes ?? undefined,
    createdAt: tip.created_at,
    updatedAt: tip.updated_at,
  }));
