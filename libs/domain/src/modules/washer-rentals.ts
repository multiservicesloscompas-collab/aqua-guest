import type { PaymentMethod, PaymentSplit } from '../core/payments';

export type MachineStatus = 'disponible' | 'mantenimiento' | 'averiada';

export interface WashingMachine {
  id: string;
  name: string;
  kg: number;
  brand: string;
  status: MachineStatus;
  isAvailable: boolean;
}

export type RentalShift = string;
export const SHIFT_UUID = {
  medio: 'd1111111-1111-1111-1111-111111111111',
  completo: 'd2222222-2222-2222-2222-222222222222',
  doble: 'd3333333-3333-3333-3333-333333333333',
} as const;
export interface RentalShiftConfig {
  id: string;
  label: string;
  priceUsd: number;
  hours: number;
  hasDivisaDiscount: boolean;
  divisaDiscountAmount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RentalShiftConfigDraft = Omit<
  RentalShiftConfig,
  'id' | 'createdAt' | 'updatedAt'
>;

export type RentalShiftConfigUpdate = Partial<RentalShiftConfigDraft>;

export const SHIFT_FALLBACKS: Record<string, RentalShiftConfig> = {
  medio: {
    id: SHIFT_UUID.medio,
    label: 'Medio Turno',
    priceUsd: 4,
    hours: 8,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 1,
    isActive: true,
  },
  completo: {
    id: SHIFT_UUID.completo,
    label: 'Completo',
    priceUsd: 6,
    hours: 24,
    hasDivisaDiscount: true,
    divisaDiscountAmount: 1,
    isActive: true,
  },
  doble: {
    id: SHIFT_UUID.doble,
    label: 'Doble',
    priceUsd: 12,
    hours: 48,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 1,
    isActive: true,
  },
  [SHIFT_UUID.medio]: {
    id: SHIFT_UUID.medio,
    label: 'Medio Turno',
    priceUsd: 4,
    hours: 8,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 1,
    isActive: true,
  },
  [SHIFT_UUID.completo]: {
    id: SHIFT_UUID.completo,
    label: 'Completo',
    priceUsd: 6,
    hours: 24,
    hasDivisaDiscount: true,
    divisaDiscountAmount: 1,
    isActive: true,
  },
  [SHIFT_UUID.doble]: {
    id: SHIFT_UUID.doble,
    label: 'Doble',
    priceUsd: 12,
    hours: 48,
    hasDivisaDiscount: false,
    divisaDiscountAmount: 1,
    isActive: true,
  },
};

export const DEFAULT_RENTAL_SHIFT: RentalShiftConfig =
  SHIFT_FALLBACKS[SHIFT_UUID.completo];

export function resolveShiftConfig(
  shift: string | null | undefined,
  catalog?: ReadonlyArray<RentalShiftConfig>
): RentalShiftConfig | null {
  if (!shift) {
    return null;
  }

  if (catalog && catalog.length > 0) {
    const fromCatalog = catalog.find((entry) => entry.id === shift);
    if (fromCatalog) {
      return fromCatalog;
    }
  }

  return SHIFT_FALLBACKS[shift] ?? null;
}

export type RentalStatus = 'agendado' | 'enviado' | 'finalizado';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export type CustomerDraft = Omit<Customer, 'id'>;

export type CustomerUpdate = Partial<CustomerDraft>;

export interface RentalExtension {
  id: string;
  rentalId: string;
  additionalHours: number;
  additionalFee: number;
  notes?: string;
  createdAt: string;
}

export interface WasherRental {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  machineId: string;
  shift: RentalShift;
  deliveryTime: string;
  pickupTime: string;
  pickupDate: string;
  deliveryFee: number;
  totalUsd: number;
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  status: RentalStatus;
  isPaid: boolean;
  datePaid?: string;
  notes?: string;
  extensions?: RentalExtension[];
  originalPickupTime?: string;
  originalPickupDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type WasherRentalLabelReference = Pick<WasherRental, 'customerName'>;

export type WasherRentalReference = Pick<WasherRental, 'id'>;

export type WasherRentalDraft = Omit<
  WasherRental,
  'id' | 'createdAt' | 'updatedAt'
>;

export type WasherRentalUpdate = Partial<WasherRentalDraft>;

export type PrepaidStatus = 'pendiente' | 'entregado';

export interface PrepaidOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  liters: number;
  amountBs: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: PrepaidStatus;
  datePaid: string;
  dateDelivered?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PrepaidOrderDraft = Omit<
  PrepaidOrder,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PrepaidOrderUpdate = Partial<
  Omit<PrepaidOrder, 'id' | 'createdAt'>
> &
  Pick<PrepaidOrder, 'updatedAt'>;

export type WashingMachineDraft = Omit<WashingMachine, 'id'>;

export type WashingMachineUpdate = Partial<WashingMachineDraft>;
