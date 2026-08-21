import { ConfiguracionTurnosEmptyState } from './components/ConfiguracionTurnosEmptyState';
import { ConfiguracionTurnosFormSheet } from './components/ConfiguracionTurnosFormSheet';
import { ConfiguracionTurnosHeader } from './components/ConfiguracionTurnosHeader';
import { ConfiguracionTurnosList } from './components/ConfiguracionTurnosList';
import { DeleteShiftDialog } from './components/DeleteShiftDialog';
import { useConfiguracionTurnosViewModel } from './hooks/useConfiguracionTurnosViewModel';

export default function ConfiguracionTurnosPage() {
  const {
    shifts,
    loadingShifts,
    formOpen,
    setFormOpen,
    formValues,
    setFormValues,
    formError,
    isSaving,
    isEditing,
    deleteOpen,
    setDeleteOpen,
    shiftToDelete,
    isDeleting,
    onOpenNew,
    onEdit,
    onToggleActive,
    onDeleteClick,
    onDeleteConfirm,
    onSubmit,
    onReload,
  } = useConfiguracionTurnosViewModel();

  return (
    <div className="min-h-screen bg-background pb-32">
      <ConfiguracionTurnosHeader
        count={shifts.length}
        isLoading={loadingShifts}
        onAdd={onOpenNew}
        onReload={onReload}
      />

      <main className="px-4 pb-4 max-w-2xl mx-auto w-full space-y-3">
        {shifts.length === 0 ? (
          <ConfiguracionTurnosEmptyState onAdd={onOpenNew} />
        ) : (
          <ConfiguracionTurnosList
            items={shifts}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDeleteClick}
          />
        )}
      </main>

      <ConfiguracionTurnosFormSheet
        open={formOpen}
        isEditing={isEditing}
        isSaving={isSaving}
        initialValues={formValues}
        errorMessage={formError}
        onOpenChange={setFormOpen}
        onChange={setFormValues}
        onSubmit={onSubmit}
      />

      <DeleteShiftDialog
        open={deleteOpen}
        shift={shiftToDelete}
        isDeleting={isDeleting}
        onOpenChange={setDeleteOpen}
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}
