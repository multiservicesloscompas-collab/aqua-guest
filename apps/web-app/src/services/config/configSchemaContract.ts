export type ProductRow = {
  id: string;
  name: string;
  default_price: number | string;
  requires_liters: boolean;
  minLiters?: number | null;
  max_liters?: number | null;
  icon?: string | null;
};

export type LiterPricingRow = {
  id?: string;
  breakpoint: number | string;
  price: number | string;
};

export type ExchangeRateRow = {
  date: string;
  rate: number | string;
  updated_at?: string | null;
  updatedAt?: string | null;
};
