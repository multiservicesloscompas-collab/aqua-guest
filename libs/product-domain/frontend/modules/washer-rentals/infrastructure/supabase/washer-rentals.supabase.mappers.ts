import type {
  Customer,
  CustomerDraft,
  CustomerUpdate,
  PrepaidOrder,
  PrepaidOrderDraft,
  PrepaidOrderUpdate,
  RentalShiftConfig,
  RentalShiftConfigDraft,
  RentalShiftConfigUpdate,
  WasherRental,
  WasherRentalDraft,
  WasherRentalUpdate,
  WashingMachine,
  WashingMachineDraft,
  WashingMachineUpdate,
} from '@aqua-guest/domain';
import { fromPaymentSplitRows } from '../../../../shared/infrastructure/supabase';
import type {
  CustomerRow,
  PrepaidOrderRow,
  RentalShiftRow,
  WasherRentalRow,
  WashingMachineRow,
} from './washer-rentals.supabase.types';

const getSafeTimestamp = () => new Date().toISOString();

const normalizeTimestamp = (value: string | null | undefined, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

export const toCustomer = (row: CustomerRow): Customer => ({ ...row });

export const toCustomerCreatePayload = (input: CustomerDraft) => ({
  name: input.name,
  phone: input.phone,
  address: input.address,
});

export const toCustomerUpdatePayload = (input: CustomerUpdate) => {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.address !== undefined) payload.address = input.address;

  return payload;
};

export const toWashingMachine = (row: WashingMachineRow): WashingMachine => ({
  id: row.id,
  name: row.name,
  kg: row.kg,
  brand: row.brand,
  status: row.status,
  isAvailable: row.isAvailable,
});

export const toWashingMachineCreatePayload = (input: WashingMachineDraft) => ({
  name: input.name,
  kg: input.kg,
  brand: input.brand,
  status: input.status,
  is_available: input.isAvailable,
});

export const toWashingMachineUpdatePayload = (input: WashingMachineUpdate) => {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.kg !== undefined) payload.kg = input.kg;
  if (input.brand !== undefined) payload.brand = input.brand;
  if (input.status !== undefined) payload.status = input.status;
  if (input.isAvailable !== undefined) payload.is_available = input.isAvailable;

  return payload;
};

export const toPrepaidOrder = (row: PrepaidOrderRow): PrepaidOrder => ({
  id: row.id,
  customerName: row.customerName,
  customerPhone: row.customerPhone ?? undefined,
  liters: Number(row.liters),
  amountBs: Number(row.amountBs),
  amountUsd: Number(row.amountUsd),
  exchangeRate: Number(row.exchangeRate),
  paymentMethod: row.paymentMethod,
  status: row.status,
  datePaid: row.datePaid,
  dateDelivered: row.dateDelivered ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: normalizeTimestamp(row.createdAt, getSafeTimestamp()),
  updatedAt: normalizeTimestamp(row.updatedAt, getSafeTimestamp()),
});

export const toPrepaidOrderCreatePayload = (input: PrepaidOrderDraft) => ({
  customer_name: input.customerName,
  customer_phone: input.customerPhone,
  liters: input.liters,
  amount_bs: input.amountBs,
  amount_usd: input.amountUsd,
  exchange_rate: input.exchangeRate,
  payment_method: input.paymentMethod,
  status: input.status,
  date_paid: input.datePaid,
  date_delivered: input.dateDelivered,
  notes: input.notes,
});

export const toPrepaidOrderUpdatePayload = (input: PrepaidOrderUpdate) => {
  const payload: Record<string, unknown> = {};

  if (input.customerName !== undefined) payload.customer_name = input.customerName;
  if (input.customerPhone !== undefined) payload.customer_phone = input.customerPhone;
  if (input.liters !== undefined) payload.liters = input.liters;
  if (input.amountBs !== undefined) payload.amount_bs = input.amountBs;
  if (input.amountUsd !== undefined) payload.amount_usd = input.amountUsd;
  if (input.exchangeRate !== undefined) payload.exchange_rate = input.exchangeRate;
  if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod;
  if (input.status !== undefined) payload.status = input.status;
  if (input.datePaid !== undefined) payload.date_paid = input.datePaid;
  if (input.dateDelivered !== undefined) payload.date_delivered = input.dateDelivered;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.updatedAt !== undefined) payload.updated_at = input.updatedAt;

  return payload;
};

export const toWasherRental = (row: WasherRentalRow): WasherRental => {
  const paymentSplits = fromPaymentSplitRows(row.paymentSplits ?? []);

  return {
    id: row.id,
    date: row.date.substring(0, 10),
    customerId: row.customerId ?? undefined,
    customerName:
      row.customers?.name ?? row.customerName ?? '',
    customerPhone:
      row.customers?.phone ?? row.customerPhone ?? '',
    customerAddress:
      row.customers?.address ?? row.customerAddress ?? '',
    machineId: row.machineId,
    shift: row.shift,
    deliveryTime: row.deliveryTime ? row.deliveryTime.substring(0, 5) : '',
    pickupTime: row.pickupTime ? row.pickupTime.substring(0, 5) : '',
    pickupDate: row.pickupDate,
    deliveryFee: Number(row.deliveryFee),
    totalUsd: Number(row.totalUsd),
    paymentMethod: row.paymentMethod ?? 'efectivo',
    paymentSplits: paymentSplits.length > 0 ? paymentSplits : undefined,
    status: row.status,
    isPaid: row.isPaid,
    datePaid: row.datePaid ? row.datePaid.substring(0, 10) : undefined,
    notes: row.notes ?? undefined,
    createdAt: normalizeTimestamp(row.createdAt, getSafeTimestamp()),
    updatedAt: normalizeTimestamp(row.updatedAt, getSafeTimestamp()),
  };
};

export const toWasherRentalCreatePayload = (input: WasherRentalDraft) => ({
  date: input.date,
  customer_id: input.customerId,
  machine_id: input.machineId,
  shift: input.shift,
  delivery_time: input.deliveryTime,
  pickup_time: input.pickupTime,
  pickup_date: input.pickupDate,
  delivery_fee: input.deliveryFee,
  total_usd: input.totalUsd,
  payment_method: input.paymentMethod,
  status: input.status,
  is_paid: input.isPaid,
  date_paid: input.datePaid ?? null,
  notes: input.notes,
});

export const toWasherRentalUpdatePayload = (input: WasherRentalUpdate) => {
  const payload: Record<string, unknown> = {};

  if (input.date !== undefined) payload.date = input.date;
  if (input.customerId !== undefined) payload.customer_id = input.customerId;
  if (input.machineId !== undefined) payload.machine_id = input.machineId;
  if (input.shift !== undefined) payload.shift = input.shift;
  if (input.deliveryTime !== undefined) payload.delivery_time = input.deliveryTime;
  if (input.pickupTime !== undefined) payload.pickup_time = input.pickupTime;
  if (input.pickupDate !== undefined) payload.pickup_date = input.pickupDate;
  if (input.deliveryFee !== undefined) payload.delivery_fee = input.deliveryFee;
  if (input.totalUsd !== undefined) payload.total_usd = input.totalUsd;
  if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod;
  if (input.status !== undefined) payload.status = input.status;
  if (input.isPaid !== undefined) payload.is_paid = input.isPaid;
  if ('datePaid' in input) payload.date_paid = input.datePaid ?? null;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
};

export const toRentalShift = (row: RentalShiftRow): RentalShiftConfig => ({
  id: row.id,
  label: row.label,
  priceUsd: Number(row.priceUsd),
  hours: Number(row.hours),
  hasDivisaDiscount: Boolean(row.hasDivisaDiscount),
  divisaDiscountAmount: Number(row.divisaDiscountAmount),
  isActive: Boolean(row.isActive),
  createdAt: normalizeTimestamp(row.createdAt, getSafeTimestamp()),
  updatedAt: normalizeTimestamp(row.updatedAt, getSafeTimestamp()),
});

export const toRentalShiftCreatePayload = (
  input: RentalShiftConfigDraft
) => ({
  label: input.label,
  price_usd: input.priceUsd,
  hours: input.hours,
  has_divisa_discount: input.hasDivisaDiscount,
  divisa_discount_amount: input.divisaDiscountAmount,
  is_active: input.isActive,
});

export const toRentalShiftUpdatePayload = (
  input: RentalShiftConfigUpdate
) => {
  const payload: Record<string, unknown> = {};

  if (input.label !== undefined) payload.label = input.label;
  if (input.priceUsd !== undefined) payload.price_usd = input.priceUsd;
  if (input.hours !== undefined) payload.hours = input.hours;
  if (input.hasDivisaDiscount !== undefined) {
    payload.has_divisa_discount = input.hasDivisaDiscount;
  }
  if (input.divisaDiscountAmount !== undefined) {
    payload.divisa_discount_amount = input.divisaDiscountAmount;
  }
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  return payload;
};
