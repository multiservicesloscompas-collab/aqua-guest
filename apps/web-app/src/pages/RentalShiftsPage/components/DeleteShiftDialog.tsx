import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface DeleteShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftLabel: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteShiftDialog({
  open,
  onOpenChange,
  shiftLabel,
  onConfirm,
  isDeleting,
}: DeleteShiftDialogProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-4 sm:p-6 pb-8 sm:pb-10">
        <DrawerHeader className="px-0 pt-2">
          <DrawerTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
            <Trash2 className="w-6 h-6" />
            Eliminar turno
          </DrawerTitle>
          <DrawerDescription className="text-sm pt-1">
            {`¿Estás seguro de eliminar "${shiftLabel}"? Dejará de aparecer al registrar alquileres. Los alquileres ya registrados conservan sus condiciones.`}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="px-0 pb-0 gap-3 pt-6">
          <Button
            size="lg"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
            data-testid="confirm-delete-confirm"
            className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Eliminar'
            )}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              size="lg"
              disabled={isDeleting}
              data-testid="confirm-delete-cancel"
              className="w-full h-14 rounded-2xl text-base font-medium border-border/50 bg-background"
            >
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
