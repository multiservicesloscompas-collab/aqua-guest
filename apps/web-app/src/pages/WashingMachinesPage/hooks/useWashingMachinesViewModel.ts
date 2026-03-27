import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMachineStore } from '@/store/useMachineStore';
import {
  MachineStatus,
  MachineStatusLabels,
  MachineStatusColors,
} from '@/types';

interface StatusOption {
  value: MachineStatus;
  label: string;
}

interface MachineListItem {
  id: string;
  name: string;
  statusLabel: string;
  statusColor: string;
  kgText: string;
  brandText: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'mantenimiento', label: 'En Mantenimiento' },
  { value: 'averiada', label: 'Averiada' },
];

export function useWashingMachinesViewModel() {
  const {
    washingMachines,
    addWashingMachine,
    updateWashingMachine,
    deleteWashingMachine,
  } = useMachineStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDeleteId, setMachineToDeleteId] = useState<string | null>(
    null
  );

  const [name, setName] = useState('');
  const [kg, setKg] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState<MachineStatus>('disponible');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setKg('');
    setBrand('');
    setStatus('disponible');
    setEditingMachineId(null);
  }, []);

  const handleOpenNew = useCallback(() => {
    resetForm();
    setSheetOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback(
    (machineId: string) => {
      const machine = washingMachines.find((item) => item.id === machineId);
      if (!machine) return;

      setEditingMachineId(machine.id);
      setName(machine.name);
      setKg(machine.kg.toString());
      setBrand(machine.brand);
      setStatus(machine.status || 'disponible');
      setSheetOpen(true);
    },
    [washingMachines]
  );

  const handleDeleteClick = useCallback((machineId: string) => {
    setMachineToDeleteId(machineId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!machineToDeleteId) {
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWashingMachine(machineToDeleteId);
      toast.success('Lavadora eliminada');
    } catch {
      toast.error('Error eliminando la lavadora');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMachineToDeleteId(null);
    }
  }, [deleteWashingMachine, machineToDeleteId]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !kg || !brand.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    const kgNum = parseFloat(kg);
    if (Number.isNaN(kgNum) || kgNum <= 0) {
      toast.error('Capacidad inválida');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMachineId) {
        await updateWashingMachine(editingMachineId, {
          name: name.trim(),
          kg: kgNum,
          brand: brand.trim(),
          status,
          isAvailable: status === 'disponible',
        });
        toast.success('Lavadora actualizada');
      } else {
        await addWashingMachine({
          name: name.trim(),
          kg: kgNum,
          brand: brand.trim(),
          status,
          isAvailable: status === 'disponible',
        });
        toast.success('Lavadora agregada');
      }
      setSheetOpen(false);
      resetForm();
    } catch {
      toast.error('Error guardando la lavadora');
    } finally {
      setIsSaving(false);
    }
  }, [
    addWashingMachine,
    brand,
    editingMachineId,
    kg,
    name,
    resetForm,
    status,
    updateWashingMachine,
  ]);

  const machinesCount = washingMachines.length;

  const machineItems = useMemo<MachineListItem[]>(
    () =>
      washingMachines.map((machine) => ({
        id: machine.id,
        name: machine.name,
        statusLabel: MachineStatusLabels[machine.status || 'disponible'],
        statusColor: MachineStatusColors[machine.status || 'disponible'],
        kgText: `${machine.kg} kg`,
        brandText: machine.brand,
      })),
    [washingMachines]
  );

  const machineToDeleteName = useMemo(() => {
    if (!machineToDeleteId) return '';
    return (
      washingMachines.find((machine) => machine.id === machineToDeleteId)
        ?.name || ''
    );
  }, [machineToDeleteId, washingMachines]);

  const isEditing = Boolean(editingMachineId);

  return {
    machinesCount,
    machineItems,
    statusOptions: STATUS_OPTIONS,
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
    onOpenNew: handleOpenNew,
    onEdit: handleEdit,
    onDeleteClick: handleDeleteClick,
    onDeleteConfirm: handleDeleteConfirm,
    onSubmit: handleSubmit,
  };
}
