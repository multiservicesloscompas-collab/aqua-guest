import { useCallback, useState } from 'react';
import type { PaymentMethod } from '@/types';
import { buildTipCaptureInput } from '@/services/tips/tipCaptureInput';

export interface HydrateTipCaptureInput {
  amountBs: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export function useTipCaptureState() {
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipPaymentMethod, setTipPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [tipNotes, setTipNotes] = useState('');

  const onToggleTip = useCallback(
    (defaultPaymentMethod?: PaymentMethod) =>
      setTipEnabled((value) => {
        const nextValue = !value;
        if (nextValue && defaultPaymentMethod) {
          setTipPaymentMethod(defaultPaymentMethod);
        }
        return nextValue;
      }),
    []
  );

  const resetTipCapture = useCallback(() => {
    setTipEnabled(false);
    setTipAmount('');
    setTipPaymentMethod('efectivo');
    setTipNotes('');
  }, []);

  const hydrateTipCapture = useCallback((input: HydrateTipCaptureInput) => {
    setTipEnabled(true);
    setTipAmount(String(input.amountBs));
    setTipPaymentMethod(input.paymentMethod);
    setTipNotes(input.notes || '');
  }, []);

  const buildTipInput = useCallback(
    () =>
      buildTipCaptureInput({
        enabled: tipEnabled,
        amount: tipAmount,
        paymentMethod: tipPaymentMethod,
        notes: tipNotes,
      }),
    [tipAmount, tipEnabled, tipNotes, tipPaymentMethod]
  );

  return {
    tipEnabled,
    tipAmount,
    tipPaymentMethod,
    tipNotes,
    onToggleTip,
    onChangeTipAmount: setTipAmount,
    onChangeTipPaymentMethod: setTipPaymentMethod,
    onChangeTipNotes: setTipNotes,
    resetTipCapture,
    hydrateTipCapture,
    buildTipInput,
  };
}
