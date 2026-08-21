import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { RentalShiftConfig } from '@aqua-guest/domain';
import { useRentalStore } from '@/store/useRentalStore';
import {
  buildEmptyShiftFormValues,
  buildShiftFormValues,
  type ShiftFormValues,
} from '../components/ConfiguracionTurnosFormSheet';

const validateShiftForm = (values: ShiftFormValues): string | null => {
  if (!values.label.trim()) {
    return 'El nombre del turno es obligatorio.';
  }

  const hours = Number(values.hours);
  if (!Number.isFinite(hours) || !Number.isInteger(hours) || hours <= 0) {
    return 'La duración debe ser un entero mayor a cero.';
  }

  const price = Number(values.priceUsd);
  if (!Number.isFinite(price) || price < 0) {
    return 'El precio base debe ser un número mayor o igual a cero.';
  }

  if (values.hasDivisaDiscount) {
    const discount = Number(values.divisaDiscountAmount);
    if (!Number.isFinite(discount) || discount < 0) {
      return 'El monto del descuento debe ser un número mayor o igual a cero.';
    }
    if (discount > price) {
      return 'El descuento no puede ser mayor que el precio base.';
    }
  }

  return null;
};

const toDraft = (
  values: ShiftFormValues
): {
  label: string;
  priceUsd: number;
  hours: number;
  hasDivisaDiscount: boolean;
  divisaDiscountAmount: number;
  isActive: boolean;
} => ({
  label: values.label.trim(),
  priceUsd: Number(values.priceUsd),
  hours: Number(values.hours),
  hasDivisaDiscount: values.hasDivisaDiscount,
  divisaDiscountAmount: values.hasDivisaDiscount
    ? Number(values.divisaDiscountAmount)
    : 0,
  isActive: values.isActive,
});

export function useConfiguracionTurnosViewModel() {
  const {
    shifts,
    loadingShifts,
    loadShifts,
    addShift,
    updateShift,
    deleteShift,
  } = useRentalStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ShiftFormValues>(() =>
    buildEmptyShiftFormValues()
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<RentalShiftConfig | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void loadShifts().catch((e) => {
      console.error(e);
    });
  }, [loadShifts]);

  const sortedShifts = useMemo(
    () =>
      [...shifts].sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return a.label.localeCompare(b.label, 'es');
      }),
    [shifts]
  );

  const handleOpenNew = useCallback(() => {
    setEditingId(null);
    setFormValues(buildEmptyShiftFormValues());
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((shift: RentalShiftConfig) => {
    setEditingId(shift.id);
    setFormValues(buildShiftFormValues(shift));
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    async (shift: RentalShiftConfig) => {
      try {
        await updateShift(shift.id, { isActive: !shift.isActive });
        toast.success(shift.isActive ? 'Turno desactivado' : 'Turno activado');
      } catch (err) {
        console.error('Error toggling shift', err);
        toast.error('No se pudo cambiar el estado del turno');
      }
    },
    [updateShift]
  );

  const handleDeleteClick = useCallback((shift: RentalShiftConfig) => {
    setShiftToDelete(shift);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!shiftToDelete) return;
    setIsDeleting(true);
    try {
      await deleteShift(shiftToDelete.id);
      toast.success('Turno eliminado');
      setDeleteOpen(false);
      setShiftToDelete(null);
    } catch (err) {
      console.error('Error deleting shift', err);
      toast.error('No se pudo eliminar el turno');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteShift, shiftToDelete]);

  const handleSubmit = useCallback(async () => {
    const error = validateShiftForm(formValues);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      if (editingId) {
        await updateShift(editingId, toDraft(formValues));
        toast.success('Turno actualizado');
      } else {
        await addShift(toDraft(formValues));
        toast.success('Turno creado');
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving shift', err);
      toast.error('No se pudo guardar el turno');
    } finally {
      setIsSaving(false);
    }
  }, [addShift, editingId, formValues, updateShift]);

  const handleReload = useCallback(async () => {
    try {
      await loadShifts();
      toast.success('Turnos actualizados');
    } catch (err) {
      console.error('Error reloading shifts', err);
      toast.error('No se pudo recargar el catálogo');
    }
  }, [loadShifts]);

  return {
    shifts: sortedShifts,
    loadingShifts,
    formOpen,
    setFormOpen,
    formValues,
    setFormValues,
    formError,
    isSaving,
    isEditing: Boolean(editingId),
    deleteOpen,
    setDeleteOpen,
    shiftToDelete,
    isDeleting,
    onOpenNew: handleOpenNew,
    onEdit: handleEdit,
    onToggleActive: handleToggleActive,
    onDeleteClick: handleDeleteClick,
    onDeleteConfirm: handleDeleteConfirm,
    onSubmit: handleSubmit,
    onReload: handleReload,
  };
}
