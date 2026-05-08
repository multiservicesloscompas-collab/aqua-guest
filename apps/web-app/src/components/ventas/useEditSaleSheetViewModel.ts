import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConfigStore } from '@/store/useConfigStore';
import { useTipStore } from '@/store/useTipStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { PaymentMethod, Sale } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { resolveSplitFormHydrationState } from '@/services/payments/paymentSplitFormHydration';
import {
  calculateFinalSaleTotals,
} from '@/services/transactions/transactionTotals';
import { resolveEditSaleTipHydration } from './editSaleTipHydration';
import { EditableCartItem } from './EditSaleItemsEditor';

interface UseEditSaleSheetViewModelParams {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useEditSaleSheetViewModel({
  sale,
  open,
  onOpenChange,
}: UseEditSaleSheetViewModelParams) {
  const { updateSale } = useWaterSalesStore();
  const { config } = useConfigStore();
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('water')
  );
  const { tips, loadTipsByDateRange } = useTipStore();

  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('efectivo');
  const [split1Amount, setSplit1Amount] = useState('');
  const [notes, setNotes] = useState('');
  const [subtotalBs, setSubtotalBs] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<EditableCartItem[]>([]);
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipPaymentMethod, setTipPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [tipNotes, setTipNotes] = useState('');
  const hydrationTokenRef = useRef(0);
  const tipRequestKeyRef = useRef<string | null>(null);

  const tipAmountBs = tipEnabled ? Number(tipAmount) || 0 : 0;
  const finalTotals = useMemo(
    () =>
      calculateFinalSaleTotals({
        principalBs: Number(subtotalBs) || 0,
        tipAmountBs,
        exchangeRate: config.exchangeRate,
      }),
    [config.exchangeRate, subtotalBs, tipAmountBs]
  );

  useEffect(() => {
    if (!sale) return;

    const splitState = resolveSplitFormHydrationState({
      paymentMethod: sale.paymentMethod,
      paymentSplits: sale.paymentSplits,
      totalBs: sale.totalBs,
    });

    setIsMixedPayment(splitState.isMixedPayment);
    setPaymentMethod(splitState.paymentMethod);
    setSplit1Amount(splitState.split1Amount);
    setSplit2Method(splitState.split2Method);
    setNotes(sale.notes || '');
    setSubtotalBs(sale.totalBs.toString());
    setItems(sale.items || []);
    setTipEnabled(false);
    setTipAmount('');
    setTipPaymentMethod(splitState.paymentMethod);
    setTipNotes('');
  }, [sale]);

  useEffect(() => {
    if (!open || !sale) {
      hydrationTokenRef.current += 1;
      tipRequestKeyRef.current = null;
      return;
    }

    const applyHydrationFromTips = (sourceTips: typeof tips) => {
      const tipHydration = resolveEditSaleTipHydration(sale, sourceTips);
      const hydratedTipAmountBs = tipHydration.enabled
        ? Number(tipHydration.amount) || 0
        : 0;

      setTipEnabled(tipHydration.enabled);
      setTipAmount(tipHydration.amount);
      setTipPaymentMethod(tipHydration.paymentMethod);
      setTipNotes(tipHydration.notes);
      setSubtotalBs(Math.max(0, sale.totalBs - hydratedTipAmountBs).toString());
    };

    const cachedTip = tips.find(
      (tip) => tip.originType === 'sale' && tip.originId === sale.id
    );
    const requestKey = `${sale.id}:${sale.date}`;

    if (cachedTip) {
      tipRequestKeyRef.current = requestKey;
      applyHydrationFromTips(tips);
      return;
    }

    if (tipRequestKeyRef.current === requestKey) {
      return;
    }

    tipRequestKeyRef.current = requestKey;

    const token = hydrationTokenRef.current + 1;
    hydrationTokenRef.current = token;

    void loadTipsByDateRange(sale.date, sale.date)
      .then(() => {
        if (hydrationTokenRef.current !== token) return;
        applyHydrationFromTips(useTipStore.getState().tips);
      })
      .catch(() => {
        if (hydrationTokenRef.current !== token) return;
        setTipEnabled(false);
        setTipAmount('');
        setTipPaymentMethod(sale.paymentMethod);
        setTipNotes('');
        setSubtotalBs(sale.totalBs.toString());
      });
  }, [loadTipsByDateRange, open, sale, tips]);

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, split2Method]);

  const onQuantityChange = (itemId: string, newQuantity: string) => {
    if (newQuantity === '') {
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, quantity: '' } : item
        )
      );
      return;
    }

    const qty = parseInt(newQuantity, 10);
    if (Number.isNaN(qty) || qty < 0) return;

    const updatedItems = items.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        quantity: qty,
        subtotal: qty * item.unitPrice,
      };
    });

    setItems(updatedItems);

    const nextSubtotal = updatedItems.reduce((sum, item) => {
      const quantity = item.quantity === '' ? 0 : item.quantity;
      return sum + quantity * item.unitPrice;
    }, 0);
    setSubtotalBs(nextSubtotal.toFixed(2));
  };

  const onSubmit = async () => {
    if (!sale) return;

    const subtotalBsNumeric = parseFloat(subtotalBs);
    if (Number.isNaN(subtotalBsNumeric) || subtotalBsNumeric <= 0) {
      toast.error('Monto inválido');
      return;
    }

    if (tipEnabled && !(tipAmountBs > 0)) {
      toast.error('Monto de propina inválido');
      return;
    }

    setIsSaving(true);
    try {
      const totals = calculateFinalSaleTotals({
        principalBs: subtotalBsNumeric,
        tipAmountBs,
        exchangeRate: config.exchangeRate,
      });

      const principalUsd =
        config.exchangeRate > 0 ? totals.principalBs / config.exchangeRate : 0;

      const basePaymentSplits: PaymentSplit[] = buildDualPaymentSplits({
        enableMixedPayment: isMixedPayment,
        primaryMethod: paymentMethod,
        secondaryMethod: split2Method,
        amountInput: split1Amount,
        amountInputMode: 'secondary',
        totalBs: totals.principalBs,
        totalUsd: principalUsd,
        exchangeRate: config.exchangeRate,
      });

      const splitValidation = normalizeAndValidatePaymentSplits({
        splits: basePaymentSplits,
        totalBs: totals.principalBs,
        totalUsd: principalUsd,
      });

      if (!splitValidation.validation.ok) {
        toast.error(splitValidation.validation.errors[0]);
        return;
      }

      await updateSale(
        sale.id,
        {
          paymentMethod,
          notes: notes.trim() || undefined,
          totalBs: totals.principalBs,
          totalUsd: principalUsd,
          paymentSplits: splitValidation.splits,
          items: items.map((item) => ({
            ...item,
            quantity:
              item.quantity === '' || item.quantity === 0 ? 1 : item.quantity,
          })),
        },
        tipEnabled
          ? {
              amountBs: tipAmountBs,
              capturePaymentMethod: tipPaymentMethod,
              notes: tipNotes.trim() || undefined,
            }
          : null
      );

      toast.success('Venta actualizada');
      onOpenChange(false);
    } catch (err) {
      console.error('Error actualizando venta:', err);
      toast.error('Error al actualizar la venta');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    paymentMethod,
    split2Method,
    split1Amount,
    notes,
    subtotalBs,
    isSaving,
    items,
    tipEnabled,
    tipAmount,
    tipPaymentMethod,
    tipNotes,
    tipAmountBs,
    finalTotals,
    isMixedPaymentEnabled,
    isMixedPayment,
    setIsMixedPayment,
    setPaymentMethod,
    setSplit2Method,
    setSplit1Amount,
    setNotes,
    setSubtotalBs,
    setTipEnabled,
    setTipAmount,
    setTipPaymentMethod,
    setTipNotes,
    onQuantityChange,
    onSubmit,
  };
}
