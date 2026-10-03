import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

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
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar turno"
      description={`¿Estás seguro de eliminar "${shiftLabel}"? Dejará de aparecer al registrar alquileres. Los alquileres ya registrados conservan sus condiciones.`}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
