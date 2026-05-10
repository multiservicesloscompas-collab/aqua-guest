import type {
  PaymentMethod,
  PaymentSplit,
  RentalShift,
  RentalStatus,
  WasherRental,
  WasherRentalDraft,
  WasherRentalUpdate,
} from '@aqua-guest/domain';
import type { TipCaptureInput } from '@/types/tips';
import { preparePaymentWritePayload } from '@/services/payments/paymentSplitWritePath';

export interface RentalRow {
  id: string;
  date: string;
  // TODO: do not use snake_case!
  customer_id: string;
  // TODO: do not use snake_case!
  machine_id: string;
  shift: RentalShift;
  // TODO: do not use snake_case!
  delivery_time: string;
  // TODO: do not use snake_case!
  pickup_time: string;
  // TODO: do not use snake_case!
  pickup_date: string;
  // TODO: do not use snake_case!
  delivery_fee: number;
  // TODO: do not use snake_case!
  total_usd: number;
  // TODO: do not use snake_case!
  payment_method: PaymentMethod;
  // TODO: do not use snake_case!
  payment_splits?: PaymentSplit[];
  status: RentalStatus;
  // TODO: do not use snake_case!
  is_paid: boolean;
  // TODO: do not use snake_case!
  date_paid?: string | null;
  notes?: string | null;
  // TODO: do not use snake_case!
  created_at?: string | null;
  // TODO: do not use snake_case!
  updated_at?: string | null;
}

export type RentalInsert = {
  date: string;
  // TODO: do not use snake_case!
  customer_id: string;
  // TODO: do not use snake_case!
  machine_id: string;
  shift: RentalShift;
  // TODO: do not use snake_case!
  delivery_time: string;
  // TODO: do not use snake_case!
  pickup_time: string;
  // TODO: do not use snake_case!
  pickup_date: string;
  // TODO: do not use snake_case!
  delivery_fee: number;
  // TODO: do not use snake_case!
  total_usd: number;
  // TODO: do not use snake_case!
  payment_method: PaymentMethod;
  status: RentalStatus;
  // TODO: do not use snake_case!
  is_paid: boolean;
  // TODO: do not use snake_case!
  date_paid: string | null;
  notes?: string;
};

export type RentalUpdate = Partial<RentalInsert> & {
  customer_id?: string;
  updated_at?: string;
};

// ─── State interface ──────────────────────────────────────────────────────────

export interface RentalState {
  rentals: WasherRental[];
  loadingRentalsByRange: Record<string, boolean>;

  addRental: (
    rental: WasherRentalDraft,
    tipInput?: TipCaptureInput
  ) => Promise<WasherRental>;
  updateRental: (
    id: string,
    updates: WasherRentalUpdate,
    tipInput?: TipCaptureInput | null
  ) => Promise<void>;
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
  originalRental?: Partial<WasherRentalDraft>
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
