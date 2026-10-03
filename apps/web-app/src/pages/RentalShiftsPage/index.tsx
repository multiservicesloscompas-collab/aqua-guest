import { DeleteShiftDialog } from './components/DeleteShiftDialog';
import { RentalShiftFormSheet } from './components/RentalShiftFormSheet';
import { RentalShiftList } from './components/RentalShiftList';
import { RentalShiftsHeader } from './components/RentalShiftsHeader';
import { RentalShiftsOfflineNotice } from './components/RentalShiftsOfflineNotice';
import { useRentalShiftsViewModel } from './hooks/useRentalShiftsViewModel';

export default function RentalShiftsPage() {
  const {
    shiftsCount,
    shiftItems,
    isOnline,
    sheetOpen,
    isEditing,
    formValues,
    formErrors,
    codePreview,
    isSaving,
    deleteDialogOpen,
    setDeleteDialogOpen,
    shiftToDeleteLabel,
    isDeleting,
    onOpenNew,
    onEdit,
    onSheetOpenChange,
    onChangeForm,
    onSubmit,
    onDeleteClick,
    onDeleteConfirm,
  } = useRentalShiftsViewModel();

  return (
    <div className="min-h-screen bg-background pb-32">
      <RentalShiftsHeader
        count={shiftsCount}
        canEdit={isOnline}
        onNew={onOpenNew}
      />

      <main className="flex-1 px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {!isOnline && <RentalShiftsOfflineNotice />}
        <RentalShiftList
          items={shiftItems}
          canEdit={isOnline}
          onEdit={onEdit}
          onDelete={onDeleteClick}
        />
      </main>

      <RentalShiftFormSheet
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
        isEditing={isEditing}
        values={formValues}
        errors={formErrors}
        codePreview={codePreview}
        isSaving={isSaving}
        onChange={onChangeForm}
        onSubmit={onSubmit}
      />

      <DeleteShiftDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        shiftLabel={shiftToDeleteLabel}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
