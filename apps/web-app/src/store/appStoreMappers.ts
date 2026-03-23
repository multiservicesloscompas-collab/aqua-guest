import type {
  ExchangeRateHistory,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Product,
  Sale,
  Tip,
} from '@/types';

type ProductRow = {
  id: string;
  name: string;
  default_price: number | string;
  requires_liters: boolean;
  minLiters?: number | null;
  max_liters?: number | null;
  icon?: string | null;
};

type PrepaidOrderRow = {
  id: string;
  customer_name?: string | null;
  customerName?: string | null;
  customer_phone?: string | null;
  customerPhone?: string | null;
  liters: number | string;
  amount_bs?: number | string | null;
  amountBs?: number | string | null;
  amount_usd?: number | string | null;
  amountUsd?: number | string | null;
  exchange_rate?: number | string | null;
  exchangeRate?: number | string | null;
  payment_method?: PaymentMethod;
  paymentMethod?: PaymentMethod;
  status: 'pendiente' | 'entregado';
  date_paid?: string | null;
  datePaid?: string | null;
  date_delivered?: string | null;
  dateDelivered?: string | null;
  notes?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

type LiterPricingRow = {
  breakpoint: number | string;
  price: number | string;
};

type PaymentBalanceTransactionRow = {
  id: string;
  date: string;
  operation_type?: 'equilibrio' | 'avance' | null;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number | string;
  amount_bs?: number | string | null;
  amount_usd?: number | string | null;
  amount_out_bs?: number | string | null;
  amount_out_usd?: number | string | null;
  amount_in_bs?: number | string | null;
  amount_in_usd?: number | string | null;
  difference_bs?: number | string | null;
  difference_usd?: number | string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SalePaymentSplitRow = {
  payment_method: PaymentMethod;
  amount_bs: number | string;
  amount_usd: number | string;
  exchange_rate_used: number | string;
};

type SaleRow = {
  id: string;
  daily_number: number;
  date: string;
  items: Sale['items'];
  payment_method: PaymentMethod;
  total_bs: number | string;
  total_usd: number | string;
  exchange_rate: number | string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  sale_payment_splits?: SalePaymentSplitRow[];
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

type ExchangeRateRow = {
  date: string;
  rate: number | string;
  updated_at?: string | null;
  updatedAt?: string | null;
};

export const mapProducts = (rows: ProductRow[]): Product[] =>
  rows.map((product) => ({
    id: product.id,
    name: product.name,
    defaultPrice: Number(product.default_price),
    requiresLiters: product.requires_liters,
    minLiters: product.minLiters ?? undefined,
    maxLiters: product.max_liters ?? undefined,
    icon: product.icon ?? undefined,
  }));

export const mapPrepaidOrders = (rows: PrepaidOrderRow[]): PrepaidOrder[] =>
  rows.map((order) => ({
    id: order.id,
    customerName: order.customer_name ?? order.customerName ?? '',
    customerPhone: order.customer_phone ?? order.customerPhone ?? undefined,
    liters: Number(order.liters),
    amountBs: Number(order.amount_bs ?? order.amountBs ?? 0),
    amountUsd: Number(order.amount_usd ?? order.amountUsd ?? 0),
    exchangeRate: Number(order.exchange_rate ?? order.exchangeRate ?? 0),
    paymentMethod: order.payment_method ?? order.paymentMethod ?? 'efectivo',
    status: order.status,
    datePaid: order.date_paid ?? order.datePaid ?? '',
    dateDelivered: order.date_delivered ?? order.dateDelivered ?? undefined,
    notes: order.notes ?? undefined,
    createdAt: order.created_at ?? order.createdAt ?? new Date().toISOString(),
    updatedAt: order.updated_at ?? order.updatedAt ?? new Date().toISOString(),
  }));

export const mapLiterPricing = (rows: LiterPricingRow[]) =>
  rows.map((pricing) => ({
    breakpoint: Number(pricing.breakpoint),
    price: Number(pricing.price),
  }));

export const mapPaymentBalanceTransactions = (
  rows: PaymentBalanceTransactionRow[]
): PaymentBalanceTransaction[] =>
  rows.map((transaction) => {
    const amount = Number(transaction.amount);
    const amountBs =
      transaction.amount_bs !== null && transaction.amount_bs !== undefined
        ? Number(transaction.amount_bs)
        : amount;
    const amountOutBs =
      transaction.amount_out_bs !== null &&
      transaction.amount_out_bs !== undefined
        ? Number(transaction.amount_out_bs)
        : amountBs;
    const amountInBs =
      transaction.amount_in_bs !== null &&
      transaction.amount_in_bs !== undefined
        ? Number(transaction.amount_in_bs)
        : amountBs;

    return {
      id: transaction.id,
      date: transaction.date,
      operationType: transaction.operation_type ?? 'equilibrio',
      fromMethod: transaction.from_method,
      toMethod: transaction.to_method,
      amount,
      amountBs,
      amountUsd:
        transaction.amount_usd !== null && transaction.amount_usd !== undefined
          ? Number(transaction.amount_usd)
          : undefined,
      amountOutBs,
      amountOutUsd:
        transaction.amount_out_usd !== null &&
        transaction.amount_out_usd !== undefined
          ? Number(transaction.amount_out_usd)
          : undefined,
      amountInBs,
      amountInUsd:
        transaction.amount_in_usd !== null &&
        transaction.amount_in_usd !== undefined
          ? Number(transaction.amount_in_usd)
          : undefined,
      differenceBs:
        transaction.difference_bs !== null &&
        transaction.difference_bs !== undefined
          ? Number(transaction.difference_bs)
          : amountInBs - amountOutBs,
      differenceUsd:
        transaction.difference_usd !== null &&
        transaction.difference_usd !== undefined
          ? Number(transaction.difference_usd)
          : undefined,
      notes: transaction.notes ?? undefined,
      createdAt: transaction.created_at || new Date().toISOString(),
      updatedAt: transaction.updated_at || new Date().toISOString(),
    };
  });

export const mapSales = (rows: SaleRow[]): Sale[] =>
  rows.map((sale) => ({
    id: sale.id,
    dailyNumber: sale.daily_number,
    date: sale.date,
    items: sale.items,
    paymentMethod: sale.payment_method,
    paymentSplits: sale.sale_payment_splits?.map((split) => ({
      method: split.payment_method,
      amountBs: Number(split.amount_bs),
      amountUsd: Number(split.amount_usd),
      exchangeRateUsed: Number(split.exchange_rate_used),
    })),
    totalBs: Number(sale.total_bs),
    totalUsd: Number(sale.total_usd),
    exchangeRate: Number(sale.exchange_rate),
    notes: sale.notes ?? undefined,
    createdAt: sale.created_at ?? new Date().toISOString(),
    updatedAt: sale.updated_at ?? new Date().toISOString(),
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

export const mapExchangeRateHistory = (
  rows: ExchangeRateRow[]
): ExchangeRateHistory[] => {
  const mappedHistory = rows.map((exchangeRate) => ({
    date: exchangeRate.date,
    rate: Number(exchangeRate.rate),
    updatedAt:
      exchangeRate.updated_at ??
      exchangeRate.updatedAt ??
      new Date().toISOString(),
  }));

  mappedHistory.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return mappedHistory;
};
