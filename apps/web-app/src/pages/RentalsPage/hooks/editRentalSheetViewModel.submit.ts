import { toast } from 'sonner';
import { getVenezuelaDate } from '@/services/DateService';
import type { WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import type { TipCaptureInput } from '@/types/tips';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';

interface EditRentalValidationParams {
  machineId: string;
  customerName: string;
  customerAddress: string;
  unavailableMachines: string[];
}

interface BuildRentalUpdatesParams {
  machineId: string;
  shift: WasherRental['shift'];
  deliveryTime: string;
  pickupTime: string;
  pickupDate: string;
  deliveryFee: number;
  totalUsd: number;
  paymentMethod: WasherRental['paymentMethod'];
  paymentSplits: NonNullable<WasherRental['paymentSplits']>;
  selectedCustomerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  status: WasherRental['status'];
  isPaid: boolean;
  datePaid: string;
}

interface SubmitEditRentalParams {
  rentalId: string;
  paymentSplits: PaymentSplit[];
  totalBs: number;
  totalUsd: number;
  updates: BuildRentalUpdatesParams;
  tipInput?: TipCaptureInput | null;
  updateRental: (
    id: string,
    updates: Partial<WasherRental>,
    tipInput?: TipCaptureInput | null
  ) => Promise<void>;
  onSuccess: () => void;
}

export function getEditRentalValidationError(
  params: EditRentalValidationParams
): string | null {
  if (!params.machineId) {
    return 'Selecciona una lavadora';
  }

  if (!params.customerName.trim() || !params.customerAddress.trim()) {
    return 'Completa nombre y dirección del cliente';
  }

  if (params.unavailableMachines.includes(params.machineId)) {
    return 'Esta lavadora no está disponible';
  }

  return null;
}

export function buildEditRentalUpdates(
  params: BuildRentalUpdatesParams
): Partial<WasherRental> {
  return {
    machineId: params.machineId,
    shift: params.shift,
    deliveryTime: params.deliveryTime,
    pickupTime: params.pickupTime,
    pickupDate: params.pickupDate,
    deliveryFee: params.deliveryFee,
    totalUsd: params.totalUsd,
    paymentMethod: params.paymentMethod,
    paymentSplits: params.paymentSplits,
    customerId: params.selectedCustomerId || undefined,
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.trim(),
    customerAddress: params.customerAddress.trim(),
    notes: params.notes.trim() || undefined,
    status: params.status,
    isPaid: params.isPaid,
    datePaid: params.isPaid
      ? params.datePaid || getVenezuelaDate()
      : (null as unknown as string),
  };
}

export function notifyEditRentalValidationError(message: string) {
  toast.error(message);
}

export async function submitEditRental(params: SubmitEditRentalParams) {
  const splitValidation = normalizeAndValidatePaymentSplits({
    splits: params.paymentSplits,
    totalBs: params.totalBs,
    totalUsd: params.totalUsd,
  });

  if (!splitValidation.validation.ok) {
    toast.error(splitValidation.validation.errors[0]);
    return;
  }

  const updates = buildEditRentalUpdates({
    ...params.updates,
    paymentSplits: splitValidation.splits,
  });

  await params.updateRental(params.rentalId, updates, params.tipInput);
  toast.success('Alquiler actualizado');
  params.onSuccess();
}
