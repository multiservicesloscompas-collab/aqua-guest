import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@aqua-guest/domain';
import type {
  RentalShift,
  RentalStatus,
  WasherRentalUpdate,
} from '@aqua-guest/domain/modules/washer-rentals';
import type { TipCaptureInput } from '@/types/tips';
import {
  getEditRentalValidationError,
  notifyEditRentalValidationError,
  submitEditRental,
} from './editRentalSheetViewModel.submit';

interface FormStateForSubmission {
  machineId: string;
  shift: RentalShift;
  deliveryTime: string;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  selectedCustomerId: string;
  paymentMethod: PaymentMethod;
  notes: string;
  status: RentalStatus;
  isPaid: boolean;
  datePaid: string;
}

interface ComputedForSubmission {
  subtotalBs: number;
  subtotalUsd: number;
  pickupInfo: {
    pickupTime: string;
    pickupDate: string;
  };
  paymentSplits: PaymentSplit[];
  unavailableMachines: string[];
}

interface TipCaptureForSubmission {
  tipEnabled: boolean;
  buildTipInput: () => TipCaptureInput | undefined;
}

interface UseEditRentalSubmissionParams {
  rentalId: string;
  form: FormStateForSubmission;
  computed: ComputedForSubmission;
  tipCapture: TipCaptureForSubmission;
  updateRental: (
    id: string,
    updates: WasherRentalUpdate,
    tipInput?: TipCaptureInput | null
  ) => Promise<void>;
  onSuccess: () => void;
}

export function useEditRentalSubmission({
  rentalId,
  form,
  computed,
  tipCapture,
  updateRental,
  onSuccess,
}: UseEditRentalSubmissionParams) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const validationError = getEditRentalValidationError({
      machineId: form.machineId,
      customerName: form.customerName,
      customerAddress: form.customerAddress,
      unavailableMachines: computed.unavailableMachines,
    });

    if (validationError) {
      notifyEditRentalValidationError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const tipInput = tipCapture.buildTipInput();

      await submitEditRental({
        rentalId,
        paymentSplits: computed.paymentSplits,
        totalBs: computed.subtotalBs,
        totalUsd: computed.subtotalUsd,
        updates: {
          machineId: form.machineId,
          shift: form.shift,
          deliveryTime: form.deliveryTime,
          pickupTime: computed.pickupInfo.pickupTime,
          pickupDate: computed.pickupInfo.pickupDate,
          deliveryFee: form.deliveryFee,
          totalUsd: computed.subtotalUsd,
          paymentMethod: form.paymentMethod,
          paymentSplits: computed.paymentSplits,
          selectedCustomerId: form.selectedCustomerId,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          notes: form.notes,
          status: form.status,
          isPaid: form.isPaid,
          datePaid: form.datePaid,
        },
        tipInput: tipCapture.tipEnabled ? tipInput : null,
        updateRental,
        onSuccess,
      });
    } catch (error: unknown) {
      console.error('Error al actualizar el alquiler:', error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'Error al actualizar el alquiler');
    } finally {
      setIsLoading(false);
    }
  }, [
    computed.paymentSplits,
    computed.pickupInfo.pickupDate,
    computed.pickupInfo.pickupTime,
    computed.subtotalBs,
    computed.subtotalUsd,
    computed.unavailableMachines,
    form.customerAddress,
    form.customerName,
    form.customerPhone,
    form.datePaid,
    form.deliveryFee,
    form.deliveryTime,
    form.isPaid,
    form.machineId,
    form.notes,
    form.paymentMethod,
    form.selectedCustomerId,
    form.shift,
    form.status,
    onSuccess,
    rentalId,
    tipCapture,
    updateRental,
  ]);

  return {
    isLoading,
    handleSubmit,
  };
}
