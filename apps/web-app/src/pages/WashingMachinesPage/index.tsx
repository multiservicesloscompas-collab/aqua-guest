import { WashingMachinesHeader } from './components/WashingMachinesHeader';
import { WashingMachinesEmptyState } from './components/WashingMachinesEmptyState';
import { WashingMachineList } from './components/WashingMachineList';
import { WashingMachineFormSheet } from './components/WashingMachineFormSheet';
import { DeleteMachineDialog } from './components/DeleteMachineDialog';
import { useWashingMachinesViewModel } from './hooks/useWashingMachinesViewModel';

export default function WashingMachinesPage() {
  const {
    machinesCount,
    machineItems,
    statusOptions,
    sheetOpen,
    setSheetOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    name,
    setName,
    kg,
    setKg,
    brand,
    setBrand,
    status,
    setStatus,
    isSaving,
    isDeleting,
    isEditing,
    machineToDeleteName,
    onOpenNew,
    onEdit,
    onDeleteClick,
    onDeleteConfirm,
    onSubmit,
  } = useWashingMachinesViewModel();

  return (
    <div className="min-h-screen bg-background pb-32">
      <WashingMachinesHeader count={machinesCount} onNew={onOpenNew} />

      <main className="flex-1 px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {machineItems.length === 0 ? (
          <WashingMachinesEmptyState onAdd={onOpenNew} />
        ) : (
          <WashingMachineList
            items={machineItems}
            onEdit={onEdit}
            onDelete={onDeleteClick}
          />
        )}
      </main>
      <WashingMachineFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isEditing={isEditing}
        name={name}
        kg={kg}
        brand={brand}
        status={status}
        statusOptions={statusOptions}
        isSaving={isSaving}
        onChangeName={setName}
        onChangeKg={setKg}
        onChangeBrand={setBrand}
        onChangeStatus={setStatus}
        onSubmit={onSubmit}
      />

      <DeleteMachineDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        machineName={machineToDeleteName}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
