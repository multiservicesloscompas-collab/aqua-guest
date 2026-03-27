import { useState, useEffect, useMemo } from 'react';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TipPaymentMethodDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmLoading?: boolean;
  defaultMethod?: PaymentMethod;
  originDate: string; // ISO yyyy-mm-dd
  onConfirm: (method: PaymentMethod, date: string) => void;
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
  originDate,
  onConfirm,
}: TipPaymentMethodDrawerProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(defaultMethod);
  const [paymentDate, setPaymentDate] = useState<string>(originDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(defaultMethod);
      setPaymentDate(originDate);
    }
  }, [isOpen, defaultMethod, originDate]);

  const originDateObj = useMemo(() => new Date(originDate + 'T00:00:00'), [originDate]);
  const paymentDateObj = useMemo(() => new Date(paymentDate + 'T00:00:00'), [paymentDate]);

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

            <div className="mt-6 space-y-3 pt-5 border-t border-border/30">
              <label className="text-[11px] font-bold text-muted-foreground px-1 uppercase tracking-widest text-center block w-full">
                Fecha de Pago
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-center rounded-2xl border-transparent bg-accent/30 text-center text-[15px] font-medium shadow-none transition-colors hover:border-border/50 hover:bg-accent active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2.5">
                      <CalendarIcon
                        className="h-4 w-4 text-primary"
                        strokeWidth={2.5}
                      />
                      {format(paymentDateObj, "PPP", { locale: es })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-border/50"
                  align="center"
                  sideOffset={12}
                >
                  <CalendarPicker
                    mode="single"
                    selected={paymentDateObj}
                    disabled={(date) => date < originDateObj}
                    onSelect={(date) => {
                      if (date) {
                        const iso = format(date, 'yyyy-MM-dd');
                        setPaymentDate(iso);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
              {paymentDate < originDate && (
                <p className="text-[10px] text-destructive text-center font-medium">
                  La fecha no puede ser anterior al {format(originDateObj, "PP", { locale: es })}
                </p>
              )}
            </div>
          </div>

          <DrawerFooter>
            <Button
              className="w-full text-base h-12"
              onClick={() => onConfirm(selectedMethod, paymentDate)}
              disabled={confirmLoading || paymentDate < originDate}
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
