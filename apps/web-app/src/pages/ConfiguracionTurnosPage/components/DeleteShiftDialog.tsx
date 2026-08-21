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
import type { RentalShiftConfig } from '@aqua-guest/domain';

interface DeleteShiftDialogProps {
  open: boolean;
  shift: RentalShiftConfig | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteShiftDialog({
  open,
  shift,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteShiftDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar turno</AlertDialogTitle>
          <AlertDialogDescription>
            {shift
              ? `Vas a eliminar "${shift.label}" del catálogo. Esta acción no se puede deshacer y los alquileres históricos conservarán su referencia original.`
              : 'Vas a eliminar un turno del catálogo.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
