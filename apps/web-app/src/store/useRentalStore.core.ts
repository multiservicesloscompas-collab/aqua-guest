/**
 * useRentalStore.core.ts
 * Type definitions and pure helper functions for the rental store.
 * No Zustand or Supabase dependencies — pure TypeScript.
 */
import {
  PaymentMethod,
  RentalShift,
  RentalStatus,
  WasherRental,
} from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';

// ─── Row / Insert / Update shapes ────────────────────────────────────────────

export interface RentalRow {
  id: string;
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  payment_splits?: PaymentSplit[];
  status: RentalStatus;
  is_paid: boolean;
  date_paid?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type RentalInsert = {
  date: string;
  customer_id: string;
  machine_id: string;
  shift: RentalShift;
  delivery_time: string;
  pickup_time: string;
  pickup_date: string;
  delivery_fee: number;
  total_usd: number;
  payment_method: PaymentMethod;
  status: RentalStatus;
  is_paid: boolean;
  date_paid: string | null;
  notes?: string;
};

export type RentalUpdate = Partial<RentalInsert> & {
  customer_id?: string;
  updated_at?: string;
};

export type CustomerUpdate = Partial<{
  name: string;
  phone: string;
  address: string;
}>;

// ─── State interface ──────────────────────────────────────────────────────────

export interface RentalState {
  rentals: WasherRental[];
  loadingRentalsByRange: Record<string, boolean>;

  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateRental: (id: string, updates: Partial<WasherRental>) => Promise<void>;
  deleteRental: (id: string) => Promise<void>;

  getRentalsByDate: (date: string) => WasherRental[];
  getActiveRentalsForDate: (date: string) => WasherRental[];

  loadRentalsByDate: (date: string) => Promise<WasherRental[]>;
  loadRentalsByDateRange: (startDate: string, endDate: string) => Promise<void>;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function buildRentalWriteContext(
  input: {
    paymentMethod: PaymentMethod;
    paymentSplits?: PaymentSplit[];
    totalUsd: number;
  },
  fallbackExchangeRate = 1
): ReturnType<typeof preparePaymentWritePayload> {
  const exchangeRateUsed =
    input.paymentSplits?.find((split) => split.exchangeRateUsed)
      ?.exchangeRateUsed ?? fallbackExchangeRate;
  const totalBs = input.totalUsd * exchangeRateUsed;

  return preparePaymentWritePayload({
    paymentMethod: input.paymentMethod,
    paymentSplits: input.paymentSplits,
    totalBs,
    totalUsd: input.totalUsd,
    exchangeRate: exchangeRateUsed,
  });
}

export function mapRentalRowToWasherRental(
  rentalRow: RentalRow,
  normalizedSplits: PaymentSplit[],
  splitWritePaymentMethod: PaymentMethod,
  originalRental?: Partial<WasherRental>
): WasherRental {
  return {
    id: rentalRow.id,
    date: rentalRow.date.substring(0, 10),
    customerId: rentalRow.customer_id,
    customerName: originalRental?.customerName ?? '',
    customerPhone: originalRental?.customerPhone ?? '',
    customerAddress: originalRental?.customerAddress ?? '',
    machineId: rentalRow.machine_id,
    shift: rentalRow.shift,
    deliveryTime: rentalRow.delivery_time,
    pickupTime: rentalRow.pickup_time,
    pickupDate: rentalRow.pickup_date,
    deliveryFee: Number(rentalRow.delivery_fee),
    totalUsd: Number(rentalRow.total_usd),
    paymentMethod: splitWritePaymentMethod,
    paymentSplits: normalizedSplits,
    status: rentalRow.status,
    isPaid: rentalRow.is_paid,
    datePaid: rentalRow.date_paid
      ? rentalRow.date_paid.substring(0, 10)
      : undefined,
    notes: rentalRow.notes || undefined,
    createdAt: rentalRow.created_at || new Date().toISOString(),
    updatedAt: rentalRow.updated_at || new Date().toISOString(),
  };
}
