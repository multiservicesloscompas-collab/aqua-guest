import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  const { cart, config, removeFromCart, clearCart, completeSale } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');

  const totalBs = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUsd = totalBs / config.exchangeRate;

  const handleComplete = () => {
    if (cart.length === 0) return;

    completeSale(paymentMethod, notes || undefined);
    setNotes('');
    setPaymentMethod('efectivo');
    onOpenChange(false);
    toast.success('¡Venta registrada correctamente!');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold">
            Carrito ({cart.length} items)
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-4">
            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
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
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Forma de Pago</p>
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
            <Textarea
              placeholder="Notas opcionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 resize-none"
            />

            {/* Total y botón */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-foreground">
                    Bs {totalBs.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${totalUsd.toFixed(2)} USD
                  </p>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full h-14 text-base font-bold gradient-primary rounded-xl shadow-fab"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar Venta
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
