import { Smartphone, Banknote, CreditCard, DollarSign } from 'lucide-react';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { cn } from '@/lib/utils';

interface CartPaymentSectionProps {
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  isMixedPayment: boolean;
}

const paymentOptions: { method: PaymentMethod; icon: typeof Smartphone }[] = [
  { method: 'pago_movil', icon: Smartphone },
  { method: 'efectivo', icon: Banknote },
  { method: 'punto_venta', icon: CreditCard },
  { method: 'divisa', icon: DollarSign },
];

export function CartPaymentSection({
  paymentMethod,
  onSelectPaymentMethod,
  isMixedPayment,
}: CartPaymentSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        {isMixedPayment ? 'Método principal' : 'Forma de Pago'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {paymentOptions.map(({ method, icon: Icon }) => (
          <button
            key={method}
            type="button"
            onClick={() => onSelectPaymentMethod(method)}
            data-testid={`cart-payment-method-${method}`}
            aria-label={`Método principal ${PaymentMethodLabels[method]}`}
            aria-pressed={paymentMethod === method}
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
  );
}
