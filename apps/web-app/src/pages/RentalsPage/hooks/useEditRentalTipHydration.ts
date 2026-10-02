import { useTipStore } from '@/store/useTipStore';
import type { WasherRental } from '@/types';
import type { Tip } from '@/types/tips';
import { useEffect, useRef, useState } from 'react';
import {
  createTipHydrationController,
  findTipByRentalOrigin,
} from './editRentalTipHydration.controller';
import type { HydrateTipCaptureInput } from './useTipCaptureState';

interface TipCaptureApi {
  hydrateTipCapture: (input: HydrateTipCaptureInput) => void;
  resetTipCapture: () => void;
}

interface UseEditRentalTipHydrationParams {
  open: boolean;
  rental: WasherRental | null;
  tipCapture: TipCaptureApi;
  /** Called with the persisted tip each time it is hydrated into the form. */
  onTipHydrated?: (tip: Tip) => void;
}

export function useEditRentalTipHydration({
  open,
  rental,
  tipCapture,
  onTipHydrated,
}: UseEditRentalTipHydrationParams) {
  const { tips, loadTipsByDateRange } = useTipStore();
  const [controller] = useState(() => createTipHydrationController());
  const { hydrateTipCapture, resetTipCapture } = tipCapture;
  const requestKeyRef = useRef<string | null>(null);
  const appliedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !rental) {
      controller.close();
      requestKeyRef.current = null;
      appliedForRef.current = null;
      resetTipCapture();
      return;
    }

    const ticket = controller.begin(rental.id);
    const cachedTip = findTipByRentalOrigin(tips, rental.id);
    const requestKey = `${rental.id}:${rental.date}`;

    if (cachedTip) {
      requestKeyRef.current = requestKey;
      if (appliedForRef.current === rental.id) return;
      appliedForRef.current = rental.id;
      hydrateTipCapture({
        amountBs: cachedTip.amountBs,
        paymentMethod: cachedTip.capturePaymentMethod,
        notes: cachedTip.notes,
      });
      onTipHydrated?.(cachedTip);
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
          if (appliedForRef.current === rental.id) return;
          appliedForRef.current = rental.id;
          hydrateTipCapture({
            amountBs: linkedTip.amountBs,
            paymentMethod: linkedTip.capturePaymentMethod,
            notes: linkedTip.notes,
          });
          onTipHydrated?.(linkedTip);
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
    onTipHydrated,
    open,
    rental,
    resetTipCapture,
    tips,
  ]);
}
