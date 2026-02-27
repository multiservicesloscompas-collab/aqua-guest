import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { getVenezuelaDate } from '@/services/DateService';
import { CheckCircle2, RotateCcw, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RentalCardDialogsProps {
  confirmDialogOpen: boolean;
  onConfirmDialogOpenChange: (open: boolean) => void;
  paymentDialogOpen: boolean;
  onPaymentDialogOpenChange: (open: boolean) => void;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmStatusChange: () => void;
  onConfirmPaymentChange: (datePaid?: string) => void;
  onConfirmDelete: () => void;
  statusChangeMessage: string;
  isPaid: boolean;
}

export function RentalCardDialogs({
  confirmDialogOpen,
  onConfirmDialogOpenChange,
  paymentDialogOpen,
  onPaymentDialogOpenChange,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  onConfirmStatusChange,
  onConfirmPaymentChange,
  onConfirmDelete,
  statusChangeMessage,
  isPaid,
}: RentalCardDialogsProps) {
  const { selectedDate } = useAppStore();
  const [paymentDate, setPaymentDate] = useState<string>('');

  useEffect(() => {
    if (paymentDialogOpen && !isPaid) {
      setPaymentDate(getVenezuelaDate());
    }
  }, [paymentDialogOpen, isPaid]);

  return (
    <>
      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={onConfirmDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmStatusChange}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={paymentDialogOpen} onOpenChange={onPaymentDialogOpenChange}>
        <DrawerContent className="p-4 sm:p-6 pb-8">
          <DrawerHeader className="px-0 pt-2">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2">
              {isPaid ? (
                <>
                  <RotateCcw className="w-6 h-6 text-destructive" />
                  Revertir Pago
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  Confirmar Pago
                </>
              )}
            </DrawerTitle>
            <DrawerDescription className="text-sm pt-1">
              {isPaid
                ? '¿Confirmas que el pago de este alquiler está pendiente?'
                : 'Verifica la fecha en la que se realizó este pago.'}
            </DrawerDescription>
          </DrawerHeader>

          {!isPaid && (
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  Fecha de Pago
                </label>
                <div className="relative flex items-center bg-muted/50 border border-border/50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Calendar className="w-5 h-5 text-muted-foreground absolute left-4 pointer-events-none" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-14 bg-transparent outline-none pl-12 pr-4 text-base font-medium appearance-none min-w-0 flex-1"
                    required
                  />
                </div>
              </div>

              {paymentDate !== selectedDate && (
                <button
                  onClick={() => setPaymentDate(selectedDate)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mx-1"
                  type="button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Usar fecha actual de la vista ({selectedDate ? format(new Date(selectedDate + 'T12:00:00'), 'dd MMM', { locale: es }) : ''})
                </button>
              )}
            </div>
          )}

          <DrawerFooter className="px-0 pb-0 gap-3 pt-6">
            <Button
              size="lg"
              variant={isPaid ? 'destructive' : 'default'}
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg"
              onClick={() => onConfirmPaymentChange(!isPaid ? paymentDate : undefined)}
            >
              {isPaid ? 'Confirmar como Pendiente' : 'Confirmar y Guardar'}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium border-border/50 bg-background"
              >
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <DrawerContent className="p-4 sm:p-6 pb-8">
          <DrawerHeader className="px-0 pt-2">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="w-6 h-6" />
              Eliminar alquiler
            </DrawerTitle>
            <DrawerDescription className="text-sm pt-1">
              Esta acción no se puede deshacer. Se eliminará permanentemente
              este registro de la base de datos.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="px-0 pb-0 gap-3 pt-6">
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg"
              onClick={onConfirmDelete}
            >
              Eliminar Permanentemente
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium border-border/50 bg-background"
              >
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
