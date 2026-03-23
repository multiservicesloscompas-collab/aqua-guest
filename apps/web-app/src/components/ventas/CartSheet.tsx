import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { MixedPaymentCard } from '../payments/MixedPaymentCard';
import { TipCaptureCard } from '@/components/tips/TipCaptureCard';
import {
  calculateFinalSaleTotals,
} from '@/services/transactions/transactionTotals';
import { CartTotalsSummary } from './CartTotalsSummary';
import { CartItemsList } from './CartItemsList';
import { CartPaymentSection } from './CartPaymentSection';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { selectedDate } = useAppStore();
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const { cart, removeFromCart, completeSale } = useWaterSalesStore();

  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('pago_movil');
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [split2Amount, setSplit2Amount] = useState('');
  const [notes, setNotes] = useState('');
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipPaymentMethod, setTipPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [tipNotes, setTipNotes] = useState('');

  const subtotalBs = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tipAmountBs = tipEnabled ? Number(tipAmount) || 0 : 0;
  const finalTotals = calculateFinalSaleTotals({
    principalBs: subtotalBs,
    tipAmountBs,
    exchangeRate,
  });

  const totalBs = finalTotals.totalBs;
  const totalUsd = finalTotals.totalUsd;

  const subtotalUsd = exchangeRate > 0 ? subtotalBs / exchangeRate : 0;

  const paymentSplits = useMemo<PaymentSplit[]>(() => {
    return buildDualPaymentSplits({
      enableMixedPayment: isMixedPayment,
      primaryMethod: paymentMethod,
      secondaryMethod: split2Method,
      amountInput: split2Amount,
      amountInputMode: 'secondary',
      totalBs: subtotalBs,
      totalUsd: subtotalUsd,
      exchangeRate,
    });
  }, [
    exchangeRate,
    isMixedPayment,
    paymentMethod,
    split2Amount,
    split2Method,
    subtotalBs,
    subtotalUsd,
  ]);

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, split2Method]);

  const handleComplete = () => {
    if (cart.length === 0) return;

    const splitValidation = normalizeAndValidatePaymentSplits({
      splits: paymentSplits,
      totalBs: subtotalBs,
      totalUsd: subtotalUsd,
    });

    if (!splitValidation.validation.ok) {
      toast.error(splitValidation.validation.errors[0]);
      return;
    }

    (async () => {
      try {
        setSaving(true);
        await completeSale(
          paymentMethod,
          selectedDate,
          notes || undefined,
          splitValidation.splits,
          tipEnabled && Number(tipAmount) > 0
            ? {
                amountBs: Number(tipAmount),
                capturePaymentMethod: tipPaymentMethod,
                notes: tipNotes.trim() || undefined,
              }
            : undefined
        );
        setNotes('');
        setPaymentMethod('efectivo');
        setSplit2Method('pago_movil');
        setSplit2Amount('');
        setIsMixedPayment(false);
        setTipEnabled(false);
        setTipAmount('');
        setTipPaymentMethod('efectivo');
        setTipNotes('');
        onOpenChange(false);
        toast.success('¡Venta registrada correctamente!');
      } catch {
        toast.error('Error registrando la venta');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] rounded-t-2xl flex flex-col p-0 gap-0 sm:h-full sm:rounded-none">
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DrawerClose>
        <DrawerHeader className="px-5 py-4 border-b">
          <DrawerTitle className="text-lg font-bold">
            Carrito ({cart.length} items)
          </DrawerTitle>
        </DrawerHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5">
            <div className="flex flex-col min-h-full pb-8">
              <div className="flex-1 space-y-6 pt-4">
                <CartItemsList items={cart} onRemove={removeFromCart} />

                <CartPaymentSection
                  paymentMethod={paymentMethod}
                  onSelectPaymentMethod={setPaymentMethod}
                  isMixedPayment={isMixedPayment}
                />

                <TipCaptureCard
                  enabled={tipEnabled}
                  amount={tipAmount}
                  paymentMethod={tipPaymentMethod}
                  notes={tipNotes}
                  onToggle={() => {
                    setTipEnabled((value) => {
                      const nextValue = !value;
                      if (nextValue) {
                        setTipPaymentMethod(paymentMethod);
                      }
                      return nextValue;
                    });
                  }}
                  onAmountChange={setTipAmount}
                  onPaymentMethodChange={setTipPaymentMethod}
                  onNotesChange={setTipNotes}
                />

                <MixedPaymentCard
                  isMixedPayment={isMixedPayment}
                  onToggle={() => {
                    const enabled = !isMixedPayment;
                    setIsMixedPayment(enabled);
                    if (!enabled) {
                      setSplit2Amount('');
                    }
                  }}
                  primaryMethod={paymentMethod}
                  secondaryMethod={split2Method}
                  amountInput={split2Amount}
                  totalBs={subtotalBs}
                  variant="grid"
                  amountInputMode="secondary"
                  onAmountInputChange={setSplit2Amount}
                  onSecondaryMethodChange={setSplit2Method}
                />

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Notas</p>
                  <Textarea
                    placeholder="Observaciones de la venta..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-20 resize-none bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 mt-auto border-t">
                <CartTotalsSummary
                  subtotalBs={subtotalBs}
                  tipAmountBs={tipAmountBs}
                  totalBs={totalBs}
                  totalUsd={totalUsd}
                />

                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="w-full h-14 text-base font-bold gradient-primary rounded-xl shadow-fab"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {saving ? 'Registrando...' : 'Confirmar Venta'}
                </Button>
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Revise los detalles antes de confirmar
                </p>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
