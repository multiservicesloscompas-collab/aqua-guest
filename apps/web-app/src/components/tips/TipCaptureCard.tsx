import { useEffect } from 'react';
import {
  Banknote,
  CreditCard,
  DollarSign,
  HandCoins,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { cn } from '@/lib/utils';

interface TipCaptureCardProps {
  enabled: boolean;
  amount: string;
  paymentMethod: PaymentMethod;
  notes: string;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onNotesChange: (value: string) => void;
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

export function TipCaptureCard({
  enabled,
  amount,
  paymentMethod,
  notes,
  onToggle,
  onAmountChange,
  onPaymentMethodChange,
  onNotesChange,
}: TipCaptureCardProps) {
  useEffect(() => {
    if (!enabled) {
      onAmountChange('');
      onNotesChange('');
    }
  }, [enabled, onAmountChange, onNotesChange]);

  return (
    <div 
      className={cn(
        "rounded-[24px] border transition-all duration-300 overflow-hidden",
        enabled ? "bg-card border-border shadow-md" : "bg-card/50 border-border/40 shadow-sm active:scale-[0.98]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div 
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors",
              enabled ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
            )}
          >
            <HandCoins className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[16px] font-bold text-foreground">Propina</span>
            <span className="text-[13px] font-medium text-muted-foreground truncate">
              {enabled ? 'Ocultar propina' : 'Agrega un extra al servicio'}
            </span>
          </div>
        </div>
        
        <div
          className={cn(
            'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors',
            enabled
              ? 'bg-muted text-muted-foreground'
              : 'bg-amber-500/10 text-amber-600'
          )}
        >
          {enabled ? 'Quitar' : 'Agregar'}
        </div>
      </button>

      {enabled && (
        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Monto (Bs)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="tipAmountBs"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ej: 20.00..."
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Metodo de pago
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = methodIcons[method];
                const isActive = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => onPaymentMethodChange(method)}
                    className={cn(
                      'flex items-center gap-3 h-14 px-4 rounded-xl border-2 transition-all text-left',
                      isActive
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-border bg-card hover:border-amber-500/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isActive ? 'text-amber-600' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[11px] font-bold leading-none',
                        isActive ? 'text-amber-700' : 'text-muted-foreground'
                      )}
                    >
                      {PaymentMethodLabels[method]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Nota (opcional)
            </Label>
            <Textarea
              className="h-16 resize-none"
              name="tipNotes"
              autoComplete="off"
              placeholder="Ej: Cliente feliz con el servicio..."
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
