import { useEffect, useState } from 'react';
import { useTipStore } from '@/store/useTipStore';
import type { PaymentMethod, WasherRental } from '@/types';
import {
  createTipHydrationController,
  findTipByRentalOrigin,
} from './editRentalTipHydration.controller';

interface TipCaptureApi {
  hydrateTipCapture: (input: {
    amountBs: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
  resetTipCapture: () => void;
}

interface UseEditRentalTipHydrationParams {
  open: boolean;
  rental: WasherRental | null;
  tipCapture: TipCaptureApi;
}

export function useEditRentalTipHydration({
  open,
  rental,
  tipCapture,
}: UseEditRentalTipHydrationParams) {
  const { tips, loadTipsByDateRange } = useTipStore();
  const [controller] = useState(() => createTipHydrationController());
  const { hydrateTipCapture, resetTipCapture } = tipCapture;

  useEffect(() => {
    if (!open || !rental) {
      controller.close();
      resetTipCapture();
      return;
    }

    const ticket = controller.begin(rental.id);
    const cachedTip = findTipByRentalOrigin(tips, rental.id);

    if (cachedTip) {
      hydrateTipCapture({
        amountBs: cachedTip.amountBs,
        paymentMethod: cachedTip.capturePaymentMethod,
        notes: cachedTip.notes,
      });
      return;
    }

    resetTipCapture();
    let cancelled = false;

    void loadTipsByDateRange(rental.date, rental.date)
      .then(() => {
        if (cancelled || !controller.canApply(ticket)) return;

        const latestTips = useTipStore.getState().tips;
        const linkedTip = findTipByRentalOrigin(latestTips, rental.id);

        if (!controller.canApply(ticket)) return;

        if (linkedTip) {
          hydrateTipCapture({
            amountBs: linkedTip.amountBs,
            paymentMethod: linkedTip.capturePaymentMethod,
            notes: linkedTip.notes,
          });
          return;
        }

        resetTipCapture();
      })
      .catch(() => {
        if (cancelled || !controller.canApply(ticket)) return;
        resetTipCapture();
      });

    return () => {
      cancelled = true;
    };
  }, [
    controller,
    hydrateTipCapture,
    loadTipsByDateRange,
    open,
    rental,
    resetTipCapture,
    tips,
  ]);
}
