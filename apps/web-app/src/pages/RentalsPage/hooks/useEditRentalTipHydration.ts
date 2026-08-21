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
  onTipHydrated?: (input: { amountBs: number; paymentMethod: PaymentMethod }) => void;
}

export function useEditRentalTipHydration({
  open,
  rental,
  tipCapture,
  onTipHydrated,
}: UseEditRentalTipHydrationParams) {
  const tips = useTipStore((state) => state.tips);
  const loadTipsByDateRange = useTipStore((state) => state.loadTipsByDateRange);
  const [controller] = useState(() => createTipHydrationController());
  const { hydrateTipCapture, resetTipCapture } = tipCapture;
  const requestKeyRef = useRef<string | null>(null);
  const onTipHydratedRef = useRef(onTipHydrated);
  onTipHydratedRef.current = onTipHydrated;

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
      onTipHydratedRef.current?.({
        amountBs: cachedTip.amountBs,
        paymentMethod: cachedTip.capturePaymentMethod,
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
          onTipHydratedRef.current?.({
            amountBs: linkedTip.amountBs,
            paymentMethod: linkedTip.capturePaymentMethod,
          });
          return;
        }

        resetTipCapture();
        onTipHydratedRef.current?.({
          amountBs: 0,
          paymentMethod: rental.paymentMethod,
        });
      })
      .catch(() => {
        if (cancelled || !controller.canApply(ticket)) return;
        resetTipCapture();
        onTipHydratedRef.current?.({
          amountBs: 0,
          paymentMethod: rental.paymentMethod,
        });
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
