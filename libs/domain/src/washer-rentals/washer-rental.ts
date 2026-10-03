import type { PaymentMethod, PaymentSplit } from '../payments';
import type { RentalShift } from './rental-shift';

export type RentalStatus = 'agendado' | 'enviado' | 'finalizado';

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

export type WasherRentalDraft = Omit<
  WasherRental,
  'id' | 'createdAt' | 'updatedAt'
>;

export type WasherRentalUpdate = Partial<WasherRentalDraft>;

export type WasherRentalLabelReference = Pick<WasherRental, 'customerName'>;
