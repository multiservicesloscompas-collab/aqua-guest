import { useEffect, useRef, useState } from 'react';
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
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !rental) {
      controller.close();
      requestKeyRef.current = null;
      resetTipCapture();
      return;
    }

    const ticket = controller.begin(rental.id);
    const cachedTip = findTipByRentalOrigin(tips, rental.id);
    const requestKey = `${rental.id}:${rental.date}`;

    if (cachedTip) {
      requestKeyRef.current = requestKey;
      hydrateTipCapture({
        amountBs: cachedTip.amountBs,
        paymentMethod: cachedTip.capturePaymentMethod,
        notes: cachedTip.notes,
      });
      return;
    }

    if (requestKeyRef.current === requestKey) {
      return;
    }

    requestKeyRef.current = requestKey;

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
