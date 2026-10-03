import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useShiftCatalog } from '@/hooks/useShiftCatalog';
import { useRentalShiftStore } from '@/store/useRentalShiftStore';
import { toShiftCode } from '@/utils/shiftCode';
import { validateShiftDraft } from '@/utils/shiftValidation';
import {
  EMPTY_SHIFT_FORM_VALUES,
  buildShiftChanges,
  formatShiftDuration,
  formatShiftPrice,
  parseShiftForm,
  toShiftFormValues,
  toShiftValidationMessages,
  type ShiftFormValues,
} from './rentalShiftsViewModel.helpers';

export interface ShiftListItem {
  id: string;
  code: string;
  label: string;
  durationText: string;
  priceText: string;
  discountText: string | null;
  canDelete: boolean;
}

export function useRentalShiftsViewModel() {
  const shifts = useShiftCatalog();
  const isOnline = useNetworkState();
  const addShift = useRentalShiftStore((state) => state.addShift);
  const updateShift = useRentalShiftStore((state) => state.updateShift);
  const deleteShift = useRentalShiftStore((state) => state.deleteShift);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ShiftFormValues>(
    EMPTY_SHIFT_FORM_VALUES
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDeleteId, setShiftToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditingShiftId(null);
    setFormValues(EMPTY_SHIFT_FORM_VALUES);
    setFormErrors([]);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingShiftId(null);
    setFormValues(EMPTY_SHIFT_FORM_VALUES);
    setFormErrors([]);
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback(
    (shiftId: string) => {
      const shift = shifts.find((item) => item.id === shiftId);
      if (!shift) return;
      setEditingShiftId(shift.id);
      setFormValues(toShiftFormValues(shift));
      setFormErrors([]);
      setSheetOpen(true);
    },
    [shifts]
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) setSheetOpen(true);
      else closeSheet();
    },
    [closeSheet]
  );

  const handleChangeForm = useCallback((values: ShiftFormValues) => {
    setFormValues(values);
    setFormErrors([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    const draft = parseShiftForm(formValues);
    const errors = validateShiftDraft(draft);
    if (errors.length > 0) {
      setFormErrors(toShiftValidationMessages(errors));
      return;
    }

    setIsSaving(true);
    try {
      const current = shifts.find((item) => item.id === editingShiftId);
      if (current) {
        const changes = buildShiftChanges(current, draft);
        if (Object.keys(changes).length > 0) {
          await updateShift(current.id, changes);
        }
        toast.success('Turno actualizado');
      } else {
        await addShift(draft);
        toast.success('Turno agregado');
      }
      closeSheet();
    } catch {
      toast.error('Error guardando el turno');
    } finally {
      setIsSaving(false);
    }
  }, [addShift, closeSheet, editingShiftId, formValues, shifts, updateShift]);

  const handleDeleteClick = useCallback((shiftId: string) => {
    setShiftToDeleteId(shiftId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!shiftToDeleteId) {
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteShift(shiftToDeleteId);
      toast.success('Turno eliminado');
    } catch {
      toast.error('Error eliminando el turno');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setShiftToDeleteId(null);
    }
  }, [deleteShift, shiftToDeleteId]);

  const shiftItems = useMemo<ShiftListItem[]>(
    () =>
      shifts.map((shift) => ({
        id: shift.id,
        code: shift.code,
        label: shift.label,
        durationText: formatShiftDuration(shift.hours),
        priceText: formatShiftPrice(shift.priceUsd),
        discountText:
          shift.divisaDiscountUsd > 0
            ? `Descuento en divisa: ${formatShiftPrice(
                shift.divisaDiscountUsd
              )}`
            : null,
        canDelete: shifts.length > 1,
      })),
    [shifts]
  );

  const codePreview = useMemo(
    () =>
      editingShiftId
        ? shifts.find((item) => item.id === editingShiftId)?.code
        : toShiftCode(
            formValues.label,
            shifts.map((item) => item.code)
          ),
    [editingShiftId, formValues.label, shifts]
  );

  const shiftToDeleteLabel = useMemo(
    () => shifts.find((item) => item.id === shiftToDeleteId)?.label ?? '',
    [shiftToDeleteId, shifts]
  );

  return {
    shiftsCount: shifts.length,
    shiftItems,
    isOnline,
    sheetOpen,
    isEditing: editingShiftId !== null,
    formValues,
    formErrors,
    codePreview,
    isSaving,
    deleteDialogOpen,
    setDeleteDialogOpen,
    shiftToDeleteLabel,
    isDeleting,
    onOpenNew: handleOpenNew,
    onEdit: handleEdit,
    onSheetOpenChange: handleSheetOpenChange,
    onChangeForm: handleChangeForm,
    onSubmit: handleSubmit,
    onDeleteClick: handleDeleteClick,
    onDeleteConfirm: handleDeleteConfirm,
  };
}
