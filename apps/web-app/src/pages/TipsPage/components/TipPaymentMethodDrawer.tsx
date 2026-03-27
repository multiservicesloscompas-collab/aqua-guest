import { useState, useEffect } from 'react';
import { Smartphone, Banknote, CreditCard, DollarSign } from 'lucide-react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { PaymentMethod, PaymentMethodLabels } from '@/types';
import { cn } from '@/lib/utils';

interface TipPaymentMethodDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmLoading?: boolean;
  defaultMethod?: PaymentMethod;
  onConfirm: (method: PaymentMethod) => void;
}

const paymentOptions: { method: PaymentMethod; icon: typeof Smartphone }[] = [
  { method: 'pago_movil', icon: Smartphone },
  { method: 'efectivo', icon: Banknote },
  { method: 'punto_venta', icon: CreditCard },
  { method: 'divisa', icon: DollarSign },
];

export function TipPaymentMethodDrawer({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar Pago',
  confirmLoading = false,
  defaultMethod = 'efectivo',
  onConfirm,
}: TipPaymentMethodDrawerProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(defaultMethod);

  // Reset to default when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(defaultMethod);
    }
  }, [isOpen, defaultMethod]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {paymentOptions.map(({ method, icon: Icon }) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  data-testid={`tip-payment-method-${method}`}
                  aria-label={`Seleccionar método ${PaymentMethodLabels[method]}`}
                  aria-pressed={selectedMethod === method}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
                    selectedMethod === method
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">
                    {PaymentMethodLabels[method]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <Button
              className="w-full text-base h-12"
              onClick={() => onConfirm(selectedMethod)}
              disabled={confirmLoading}
            >
              {confirmLoading ? 'Procesando...' : confirmText}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => onOpenChange(false)}
              disabled={confirmLoading}
            >
              Cancelar
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
