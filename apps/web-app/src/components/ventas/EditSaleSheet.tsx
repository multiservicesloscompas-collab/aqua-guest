import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sale, PaymentMethod, PaymentMethodLabels, CartItem } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { useConfigStore } from '@/store/useConfigStore';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeAndValidatePaymentSplits } from '@/services/payments/paymentSplitValidation';
import { buildDualPaymentSplits } from '@/services/payments/paymentSplitWritePath';
import { SaleMixedPaymentFields } from './SaleMixedPaymentFields';

interface EditSaleSheetProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSaleSheet({
  sale,
  open,
  onOpenChange,
}: EditSaleSheetProps) {
  const { updateSale } = useWaterSalesStore();
  const { config } = useConfigStore();
  const isMixedPaymentEnabled = useConfigStore((state) =>
    state.isMixedPaymentEnabled('water')
  );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil');
  const [split2Method, setSplit2Method] = useState<PaymentMethod>('efectivo');
  const [split1Amount, setSplit1Amount] = useState('');
  const [notes, setNotes] = useState('');
  const [totalBs, setTotalBs] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // We need a local type that allows quantity to be empty string for the input
  interface EditableCartItem extends Omit<CartItem, 'quantity'> {
    quantity: number | '';
  }
  const [items, setItems] = useState<EditableCartItem[]>([]);

  useEffect(() => {
    if (sale) {
      setPaymentMethod(sale.paymentMethod);
      const splitMain = sale.paymentSplits?.find(
        (split) => split.method === sale.paymentMethod
      );
      const splitSecondary = sale.paymentSplits?.find(
        (split) => split.method !== sale.paymentMethod
      );
      setSplit1Amount(splitMain ? String(splitMain.amountBs) : '');
      setSplit2Method(splitSecondary?.method ?? 'efectivo');
      setNotes(sale.notes || '');
      setTotalBs(sale.totalBs.toString());
      setItems(sale.items || []);
    }
  }, [sale]);

  useEffect(() => {
    if (split2Method === paymentMethod) {
      setSplit2Method(paymentMethod === 'efectivo' ? 'pago_movil' : 'efectivo');
    }
  }, [paymentMethod, split2Method]);

  const handleQuantityChange = (itemId: string, newQuantity: string) => {
    // Allow empty string to let user clear the input
    if (newQuantity === '') {
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, quantity: '' } : item
        )
      );
      return;
    }

    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 0) return; // Allow 0 momentarily or just ignore negative

    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: qty,
          subtotal: qty * item.unitPrice,
        };
      }
      return item;
    });

    setItems(updatedItems);

    // Auto-update total price based on items (treating empty or invalid as 0)
    const newTotal = updatedItems.reduce((sum, item) => {
      const q = item.quantity === '' ? 0 : item.quantity;
      return sum + q * item.unitPrice;
    }, 0);
    setTotalBs(newTotal.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!sale) return;

    const newTotalBs = parseFloat(totalBs);
    if (isNaN(newTotalBs) || newTotalBs <= 0) {
      toast.error('Monto inválido');
      return;
    }

    setIsSaving(true);
    try {
      const totalUsd = newTotalBs / config.exchangeRate;
      const paymentSplits: PaymentSplit[] = buildDualPaymentSplits({
        enableMixedPayment: isMixedPaymentEnabled,
        primaryMethod: paymentMethod,
        secondaryMethod: split2Method,
        amountInput: split1Amount,
        amountInputMode: 'primary',
        totalBs: newTotalBs,
        totalUsd,
        exchangeRate: config.exchangeRate,
      });

      const splitValidation = normalizeAndValidatePaymentSplits({
        splits: paymentSplits,
        totalBs: newTotalBs,
        totalUsd,
      });

      if (!splitValidation.validation.ok) {
        toast.error(splitValidation.validation.errors[0]);
        return;
      }

      await updateSale(sale.id, {
        paymentMethod,
        notes: notes.trim() || undefined,
        totalBs: newTotalBs,
        totalUsd,
        paymentSplits: splitValidation.splits,
        // Map back to strict CartItem type (ensure no empty strings)
        items: items.map((i) => ({
          ...i,
          quantity: i.quantity === '' || i.quantity === 0 ? 1 : i.quantity,
        })),
      });

      toast.success('Venta actualizada');
      onOpenChange(false);
    } catch (err) {
      console.error('Error actualizando venta:', err);
      toast.error('Error al actualizar la venta');
    } finally {
      setIsSaving(false);
    }
  };

  if (!sale) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px]"
        className="h-auto rounded-t-2xl px-4 pb-8 sm:h-full sm:rounded-none overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Venta #{sale.dailyNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Total (Bs)</Label>
            <Input
              type="number"
              step="0.01"
              value={totalBs}
              onChange={(e) => setTotalBs(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Método de Pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PaymentMethodLabels).map(([method, label]) => (
                  <SelectItem key={method} value={method}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMixedPaymentEnabled && (
            <SaleMixedPaymentFields
              primaryMethod={paymentMethod}
              secondaryMethod={split2Method}
              amountInput={split1Amount}
              totalBs={Number(totalBs) || 0}
              variant="select"
              amountInputMode="primary"
              onAmountInputChange={setSplit1Amount}
              onSecondaryMethodChange={setSplit2Method}
            />
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 resize-none"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold">Ítems</Label>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {item.productName}
                    </div>
                    {item.liters && (
                      <div className="text-xs text-muted-foreground">
                        {item.liters}L
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Cant.
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      className="w-16 h-8 text-center"
                    />
                  </div>

                  <div className="w-20 text-right font-medium text-sm">
                    Bs {item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full h-12 text-base font-bold"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
