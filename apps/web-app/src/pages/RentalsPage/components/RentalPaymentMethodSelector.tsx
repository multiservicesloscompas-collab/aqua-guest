import { Banknote, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '@/types';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

interface RentalPaymentMethodSelectorProps {
  options: PaymentMethodOption[];
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

function getIcon(method: PaymentMethod) {
  switch (method) {
    case 'pago_movil':
      return Smartphone;
    case 'efectivo':
      return Banknote;
    case 'punto_venta':
      return CreditCard;
    case 'divisa':
      return DollarSign;
  }
}

export function RentalPaymentMethodSelector({
  options,
  selectedMethod,
  onSelect,
}: RentalPaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        Método de Pago
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {options.slice(0, 2).map((option) => {
          const Icon = getIcon(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              variant={selectedMethod === option.value ? 'default' : 'outline'}
              onClick={() => onSelect(option.value)}
              className="h-14 flex flex-col gap-1 p-2"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{option.label}</span>
            </Button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.slice(2).map((option) => {
          const Icon = getIcon(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              variant={selectedMethod === option.value ? 'default' : 'outline'}
              onClick={() => onSelect(option.value)}
              className="h-14 flex flex-col gap-1 p-2"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{option.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
