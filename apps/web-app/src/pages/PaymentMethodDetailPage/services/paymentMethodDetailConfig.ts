import { ComponentType } from 'react';
import { Banknote, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { PaymentMethod } from '@/types';

export interface PaymentMethodConfig {
  icon: ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, PaymentMethodConfig> =
  {
    efectivo: {
      icon: Banknote,
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-500/10',
      borderClass: 'border-orange-500/20',
    },
    pago_movil: {
      icon: Smartphone,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/20',
    },
    punto_venta: {
      icon: CreditCard,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-500/10',
      borderClass: 'border-purple-500/20',
    },
    divisa: {
      icon: DollarSign,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-500/10',
      borderClass: 'border-green-500/20',
    },
  };

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];
