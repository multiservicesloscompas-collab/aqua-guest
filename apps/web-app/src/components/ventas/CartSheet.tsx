import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { Trash2, Smartphone, Banknote, CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentOptions: { method: PaymentMethod; icon: typeof Smartphone }[] = [
  { method: 'pago_movil', icon: Smartphone },
  { method: 'efectivo', icon: Banknote },
  { method: 'punto_venta', icon: CreditCard },
];

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cart, config, removeFromCart, clearCart, completeSale } =
    useAppStore();
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');

  const totalBs = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUsd = totalBs / config.exchangeRate;

  const handleComplete = () => {
    if (cart.length === 0) return;

    (async () => {
      try {
        setSaving(true);
        await completeSale(paymentMethod, notes || undefined);
        setNotes('');
        setPaymentMethod('efectivo');
        onOpenChange(false);
        toast.success('¡Venta registrada correctamente!');
      } catch (err) {
        toast.error('Error registrando la venta');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="text-lg font-bold">
            Carrito ({cart.length} items)
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5">
            <div className="flex flex-col min-h-full pb-8">
              <div className="flex-1 space-y-6 pt-4">
                {/* Lista de items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x Bs {item.unitPrice.toFixed(2)}
                          {item.liters && ` • ${item.liters}L`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          Bs {item.subtotal.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Método de pago */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Forma de Pago
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentOptions.map(({ method, icon: Icon }) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                          paymentMethod === method
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            paymentMethod === method
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            paymentMethod === method
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        >
                          {PaymentMethodLabels[method]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
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

              {/* Total y botón */}
              <div className="space-y-4 pt-6 mt-auto border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    Total a Pagar
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-foreground">
                      Bs {totalBs.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${totalUsd.toFixed(2)} USD
                    </p>
                  </div>
                </div>

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
      </SheetContent>
    </Sheet>
  );
}
