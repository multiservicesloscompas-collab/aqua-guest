import {
  Banknote,
  CreditCard,
  DollarSign,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SaleMixedPaymentFieldsProps {
  primaryMethod: PaymentMethod;
  secondaryMethod: PaymentMethod;
  amountInput: string;
  totalBs: number;
  variant: 'grid' | 'select';
  amountInputMode: 'primary' | 'secondary';
  onAmountInputChange: (value: string) => void;
  onSecondaryMethodChange: (value: PaymentMethod) => void;
  hideHeader?: boolean;
}

const methodIcons: Record<PaymentMethod, LucideIcon> = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
  divisa: DollarSign,
};

const paymentMethods: PaymentMethod[] = [
  'pago_movil',
  'efectivo',
  'punto_venta',
  'divisa',
];

export function SaleMixedPaymentFields({
  primaryMethod,
  secondaryMethod,
  amountInput,
  totalBs,
  variant,
  amountInputMode,
  onAmountInputChange,
  onSecondaryMethodChange,
  hideHeader,
}: SaleMixedPaymentFieldsProps) {
  const secondaryMethods = paymentMethods.filter(
    (method) => method !== primaryMethod
  );

  const normalizedInput = Number(amountInput || 0);
  const clampedInput = Number.isNaN(normalizedInput)
    ? 0
    : Math.min(Math.max(0, normalizedInput), totalBs);
  const computedPrimaryAmount =
    amountInputMode === 'secondary' ? totalBs - clampedInput : clampedInput;
  const computedSecondaryAmount =
    amountInputMode === 'secondary' ? clampedInput : totalBs - clampedInput;

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <p className="text-sm font-semibold text-foreground">Pago mixto</p>
      )}
      
      <div className="space-y-2">
        <label
          htmlFor="mixed-payment-amount-input"
          className="text-xs font-medium text-muted-foreground"
        >
          {amountInputMode === 'secondary'
            ? 'Monto método secundario (Bs)'
            : 'Monto método principal (Bs)'}
        </label>
        <input
          id="mixed-payment-amount-input"
          type="number"
          min="0"
          max={totalBs}
          step="0.01"
          value={amountInput}
          onChange={(event) => onAmountInputChange(event.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="0.00"
        />
      </div>

      {variant === 'grid' ? (
        <div className="grid grid-cols-3 gap-2">
          {secondaryMethods.map((method) => {
            const Icon = methodIcons[method];
            return (
              <button
                key={method}
                type="button"
                onClick={() => onSecondaryMethodChange(method)}
                aria-label={`Método secundario ${PaymentMethodLabels[method]}`}
                aria-pressed={secondaryMethod === method}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-14 rounded-xl border-2 transition-all',
                  secondaryMethod === method
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    secondaryMethod === method
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    secondaryMethod === method
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {PaymentMethodLabels[method]}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Select
          value={secondaryMethod}
          onValueChange={(value) =>
            onSecondaryMethodChange(value as PaymentMethod)
          }
        >
          <SelectTrigger className="h-12" aria-label="Método secundario">
            <SelectValue placeholder="Método secundario" />
          </SelectTrigger>
          <SelectContent>
            {secondaryMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {PaymentMethodLabels[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-muted-foreground">
        Monto método principal: Bs{' '}
        {Math.max(0, computedPrimaryAmount).toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground">
        Monto método secundario: Bs{' '}
        {Math.max(0, computedSecondaryAmount).toFixed(2)}
      </p>
    </div>
  );
}
