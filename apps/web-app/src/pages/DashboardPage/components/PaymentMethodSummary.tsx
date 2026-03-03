import { ComponentType } from 'react';
import { Wallet } from 'lucide-react';
import { PaymentMethod } from '@/types';
import { PaymentMethodCard } from './PaymentMethodCard';

interface PaymentMethodItem {
  id: PaymentMethod;
  title: string;
  amountText: string;
  convertedText: string;
  accent: {
    background: string;
    border: string;
    icon: string;
    title: string;
    value: string;
  };
  icon: ComponentType<{ className?: string }>;
}

interface PaymentMethodSummaryProps {
  currencyLabel: string;
  items: PaymentMethodItem[];
  onPaymentMethodClick?: (method: PaymentMethod) => void;
}

export function PaymentMethodSummary({
  currencyLabel,
  items,
  onPaymentMethodClick,
}: PaymentMethodSummaryProps) {
  return (
    <section className="bg-card rounded-2xl border p-5 space-y-4 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Resumen por Pago (Hoy)
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
          {currencyLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <PaymentMethodCard
            key={item.id}
            title={item.title}
            amountText={item.amountText}
            convertedText={item.convertedText}
            accent={item.accent}
            icon={item.icon}
            onClick={() => onPaymentMethodClick?.(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
