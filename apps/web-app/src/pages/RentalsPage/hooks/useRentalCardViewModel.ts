import { useCallback, useMemo, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useMachineStore } from '@/store/useMachineStore';
import { canExtendRental } from '@/utils/rentalExtensions';
import { RentalShiftConfig, RentalStatus, WasherRental } from '@/types';

interface RentalCardViewModelInput {
  rental: WasherRental;
  onStatusChange: (id: string, status: RentalStatus) => void;
  onPaymentToggle: (id: string, datePaid?: string) => void;
  onEdit?: (rental: WasherRental) => void;
  onDelete?: (id: string) => void;
  onExtend?: (rental: WasherRental) => void;
}

export function useRentalCardViewModel({
  rental,
  onStatusChange,
  onPaymentToggle,
  onEdit,
  onDelete,
  onExtend,
}: RentalCardViewModelInput) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RentalStatus | null>(null);

  const { washingMachines } = useMachineStore();
  const machine = useMemo(
    () => washingMachines.find((m) => m.id === rental.machineId),
    [washingMachines, rental.machineId]
  );
  const shiftConfig = RentalShiftConfig[rental.shift];
  const canExtend = canExtendRental(rental);

  const handleStatusClick = useCallback((status: RentalStatus) => {
    setPendingStatus(status);
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingStatus) {
      onStatusChange(rental.id, pendingStatus);
    }
    setConfirmDialogOpen(false);
    setPendingStatus(null);
  }, [onStatusChange, pendingStatus, rental.id]);

  const handlePaymentClick = useCallback(() => {
    setPaymentDialogOpen(true);
  }, []);

  const handlePaymentConfirm = useCallback((datePaid?: string) => {
    onPaymentToggle(rental.id, datePaid);
    setPaymentDialogOpen(false);
  }, [onPaymentToggle, rental.id]);

  const handleEditClick = useCallback(() => {
    onEdit?.(rental);
  }, [onEdit, rental]);

  const handleExtendClick = useCallback(() => {
    onExtend?.(rental);
  }, [onExtend, rental]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.(rental.id);
    setDeleteDialogOpen(false);
  }, [onDelete, rental.id]);

  const statusChangeMessage = useMemo(() => {
    if (pendingStatus === 'enviado') {
      return '¿Confirmar que la lavadora ha sido enviada al cliente?';
    }
    if (pendingStatus === 'finalizado') {
      if (rental.status === 'agendado') {
        return '¿Confirmar que el cliente ha recogido la lavadora?';
      }
      return '¿Confirmar que el alquiler ha finalizado y la lavadora fue recogida?';
    }
    return '¿Confirmar el cambio de estado?';
  }, [pendingStatus, rental.status]);

  const handleCopyId = useCallback(async () => {
    const textToCopy = rental.id;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast.success('ID copiado', {
        description: textToCopy,
        duration: 2000,
      });
    } catch (err) {
      console.error('Error al copiar:', err);
      toast.error('No se pudo copiar el ID');
    }
  }, [rental.id]);

  return {
    machine,
    shiftConfig,
    canExtend,
    confirmDialogOpen,
    setConfirmDialogOpen,
    paymentDialogOpen,
    setPaymentDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    statusChangeMessage,
    handleStatusClick,
    handleConfirm,
    handlePaymentClick,
    handlePaymentConfirm,
    handleEditClick,
    handleExtendClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleCopyId,
  };
}
