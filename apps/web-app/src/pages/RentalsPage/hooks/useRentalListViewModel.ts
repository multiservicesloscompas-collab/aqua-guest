import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useRentalStore } from '@/store/useRentalStore';
import { getVenezuelaDate } from '@/services/DateService';
import { RentalStatus, WasherRental } from '@/types';

interface RentalListViewModel {
  rentals: WasherRental[];
  editingRental: WasherRental | null;
  editSheetOpen: boolean;
  setEditSheetOpen: (open: boolean) => void;
  extensionDialogOpen: boolean;
  setExtensionDialogOpen: (open: boolean) => void;
  selectedRental: WasherRental | null;
  handleStatusChange: (id: string, status: RentalStatus) => void;
  handlePaymentToggle: (id: string, datePaid?: string) => void;
  handleEdit: (rental: WasherRental) => void;
  handleDelete: (id: string) => void;
  handleExtendRental: (rental: WasherRental) => void;
  handleExtensionApplied: (updatedRental: WasherRental) => void;
}

const STATUS_ORDER: Record<RentalStatus, number> = {
  agendado: 0,
  enviado: 1,
  finalizado: 2,
};

export function useRentalListViewModel(): RentalListViewModel {
  const { selectedDate } = useAppStore();
  const { getRentalsByDate, updateRental, deleteRental } = useRentalStore();
  const rentals = getRentalsByDate(selectedDate);
  const [editingRental, setEditingRental] = useState<WasherRental | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<WasherRental | null>(
    null
  );

  const handleStatusChange = useCallback(
    async (id: string, status: RentalStatus) => {
      try {
        await updateRental(id, { status });
      } catch (error) {
        console.error('Error al actualizar estado del alquiler:', error);
        toast.error('Error al actualizar estado del alquiler');
      }
    },
    [updateRental]
  );

  const handlePaymentToggle = useCallback(
    async (id: string, datePaid?: string) => {
      const rental = rentals.find((r) => r.id === id);
      if (!rental) return;

      const newIsPaid = !rental.isPaid;
      const updates: Partial<WasherRental> = { isPaid: newIsPaid };

      if (newIsPaid) {
        updates.datePaid = datePaid || getVenezuelaDate();
      } else {
        updates.datePaid = undefined;
      }

      try {
        await updateRental(id, updates);
      } catch (error) {
        console.error('Error al actualizar pago del alquiler:', error);
        toast.error('Error al actualizar pago del alquiler');
      }
    },
    [rentals, updateRental]
  );

  const handleEdit = useCallback((rental: WasherRental) => {
    setEditingRental(rental);
    setEditSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteRental(id);
        toast.success('Alquiler eliminado');
      } catch (error) {
        console.error('Error al eliminar alquiler:', error);
        toast.error('Error al eliminar alquiler');
      }
    },
    [deleteRental]
  );

  const handleExtendRental = useCallback((rental: WasherRental) => {
    setSelectedRental(rental);
    setExtensionDialogOpen(true);
  }, []);

  const handleExtensionApplied = useCallback(
    async (updatedRental: WasherRental) => {
      try {
        await updateRental(updatedRental.id, updatedRental);
        setSelectedRental(updatedRental);
      } catch (error) {
        console.error('Error al extender alquiler:', error);
        toast.error('Error al extender alquiler');
      }
    },
    [updateRental]
  );

  const sortedRentals = useMemo(
    () =>
      [...rentals].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      ),
    [rentals]
  );

  return {
    rentals: sortedRentals,
    editingRental,
    editSheetOpen,
    setEditSheetOpen,
    extensionDialogOpen,
    setExtensionDialogOpen,
    selectedRental,
    handleStatusChange,
    handlePaymentToggle,
    handleEdit,
    handleDelete,
    handleExtendRental,
    handleExtensionApplied,
  };
}
