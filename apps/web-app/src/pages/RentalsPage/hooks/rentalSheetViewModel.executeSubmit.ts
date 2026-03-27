import { toast } from 'sonner';
import { buildTipCaptureInput } from '@/services/tips/tipCaptureInput';
import type { PaymentMethod, WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { submitRental } from './rentalSheetViewModel.submit';

interface ExecuteSubmitParams {
  machineId: string;
  customerName: string;
  customerAddress: string;
  unavailableMachines: string[];
  paymentSplits: PaymentSplit[];
  paymentMethod: PaymentMethod;
  tipAmountBsNumeric: number;
  tipPaymentMethod: PaymentMethod;
  exchangeRate: number;
  totalBs: number;
  totalUsd: number;
  selectedDate: string;
  selectedCustomerId: string;
  customerPhone: string;
  shift: 'medio' | 'completo' | 'doble';
  deliveryTime: string;
  pickupInfo: { pickupTime: string; pickupDate: string };
  deliveryFee: number;
  notes: string;
  tipEnabled: boolean;
  tipAmount: string;
  tipNotes: string;
  addRental: (
    rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>,
    tipInput?: ReturnType<typeof buildTipCaptureInput>
  ) => Promise<WasherRental>;
  onOpenChange: (open: boolean) => void;
  resetForm: () => void;
  setIsSaving: (value: boolean) => void;
  getRentalValidationError: (params: {
    machineId: string;
    customerName: string;
    customerAddress: string;
    unavailableMachines: string[];
  }) => string | null;
  isPaid: boolean;
  datePaid: string;
}

export async function executeRentalSubmit(params: ExecuteSubmitParams) {
  const validationError = params.getRentalValidationError({
    machineId: params.machineId,
    customerName: params.customerName,
    customerAddress: params.customerAddress,
    unavailableMachines: params.unavailableMachines,
  });

  if (validationError) {
    toast.error(validationError);
    return;
  }

  params.setIsSaving(true);
  try {
    await submitRental({
      paymentSplits: params.paymentSplits,
      paymentMethod: params.paymentMethod,
      tipAmountBs: params.tipAmountBsNumeric,
      tipPaymentMethod: params.tipPaymentMethod,
      exchangeRate: params.exchangeRate,
      totalBs: params.totalBs,
      totalUsd: params.totalUsd,
      rentalPayload: {
        date: params.selectedDate,
        customerId: params.selectedCustomerId || undefined,
        customerName: params.customerName.trim(),
        customerPhone: params.customerPhone.trim(),
        customerAddress: params.customerAddress.trim(),
        machineId: params.machineId,
        shift: params.shift,
        deliveryTime: params.deliveryTime,
        pickupTime: params.pickupInfo.pickupTime,
        pickupDate: params.pickupInfo.pickupDate,
        deliveryFee: params.deliveryFee,
        totalUsd: params.totalUsd,
        paymentMethod: params.paymentMethod,
        paymentSplits: params.paymentSplits,
        status: 'agendado',
        isPaid: params.isPaid,
        datePaid: params.isPaid ? params.datePaid : undefined,
        notes: params.notes.trim() || undefined,
      },
      tipInput: buildTipCaptureInput({
        enabled: params.tipEnabled,
        amount: params.tipAmount,
        paymentMethod: params.tipPaymentMethod,
        notes: params.tipNotes,
      }),
      addRental: params.addRental,
    });

    toast.success('Alquiler registrado');
    params.onOpenChange(false);
    params.resetForm();
  } catch (err: unknown) {
    console.error('Error registrando alquiler:', err);
    const message = err instanceof Error ? err.message : undefined;
    toast.error(message || 'Error al registrar el alquiler');
  } finally {
    params.setIsSaving(false);
  }
}
