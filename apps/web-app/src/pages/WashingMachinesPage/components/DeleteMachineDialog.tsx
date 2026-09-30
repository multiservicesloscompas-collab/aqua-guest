import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

interface DeleteMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteMachineDialog({
  open,
  onOpenChange,
  machineName,
  onConfirm,
  isDeleting,
}: DeleteMachineDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar lavadora"
      description={`¿Estás seguro de eliminar "${machineName}"? Esta acción no se puede deshacer.`}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
