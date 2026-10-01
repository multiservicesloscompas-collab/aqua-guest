import type {
  ExchangeRateHistory,
  PaymentBalanceTransaction,
  PrepaidOrder,
  ProductWithIcon,
  Sale,
  Tip,
} from '@/types';
import type { PaymentBalanceRow } from '@/services/payments/paymentBalanceSchemaContract';
import { rowToTransaction } from './usePaymentBalanceStore.core';
import type {
  ExchangeRateRow,
  LiterPricingRow,
  ProductRow,
} from '@/services/config/configSchemaContract';
import type { PrepaidOrderRow } from '@/services/prepaid/prepaidSchemaContract';
import type { TipRow } from '@/services/tips/tipSchemaContract';
import type { SaleRow } from '@/services/sales/saleSchemaContract';

export const mapProducts = (rows: ProductRow[]): ProductWithIcon[] =>
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
  rows: PaymentBalanceRow[]
): PaymentBalanceTransaction[] => rows.map(rowToTransaction);

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
