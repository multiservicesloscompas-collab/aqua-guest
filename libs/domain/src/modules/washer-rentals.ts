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

export type RentalShift = 'medio' | 'completo' | 'doble';

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

export type WasherRentalLabelReference = Pick<
  WasherRental,
  'customerName'
>;

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
