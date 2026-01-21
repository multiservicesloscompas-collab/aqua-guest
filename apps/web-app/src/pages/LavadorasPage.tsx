import { useState } from 'react';
import {
  WashingMachine as WashingMachineIcon,
  Plus,
  Pencil,
  Trash2,
  Weight,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import {
  WashingMachine,
  MachineStatus,
  MachineStatusLabels,
  MachineStatusColors,
} from '@/types';
import { toast } from 'sonner';

export default function LavadorasPage() {
  const {
    washingMachines,
    addWashingMachine,
    updateWashingMachine,
    deleteWashingMachine,
  } = useAppStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<WashingMachine | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<WashingMachine | null>(
    null
  );

  // Form state
  const [name, setName] = useState('');
  const [kg, setKg] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState<MachineStatus>('disponible');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = () => {
    setName('');
    setKg('');
    setBrand('');
    setStatus('disponible');
    setEditingMachine(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setSheetOpen(true);
  };

  const handleEdit = (machine: WashingMachine) => {
    setEditingMachine(machine);
    setName(machine.name);
    setKg(machine.kg.toString());
    setBrand(machine.brand);
    setStatus(machine.status || 'disponible');
    setSheetOpen(true);
  };

  const handleDeleteClick = (machine: WashingMachine) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (machineToDelete) {
      setIsDeleting(true);
      try {
        await deleteWashingMachine(machineToDelete.id);
        toast.success('Lavadora eliminada');
      } catch (err) {
        toast.error('Error eliminando la lavadora');
      } finally {
        setIsDeleting(false);
      }
    }
    setDeleteDialogOpen(false);
    setMachineToDelete(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !kg || !brand.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    const kgNum = parseFloat(kg);
    if (isNaN(kgNum) || kgNum <= 0) {
      toast.error('Capacidad inválida');
      return;
    }

    setIsSaving(true);
    // persist via supabase-backed store (async)
    try {
      if (editingMachine) {
        await updateWashingMachine(editingMachine.id, {
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
    } catch (err) {
      toast.error('Error guardando la lavadora');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <WashingMachineIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Lavadoras</h1>
                <p className="text-xs text-muted-foreground">
                  {washingMachines.length} registradas
                </p>
              </div>
            </div>
            <Button onClick={handleOpenNew} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Lavadoras */}
      <main className="flex-1 px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {washingMachines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <WashingMachineIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No hay lavadoras registradas
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Agrega tu primera lavadora para empezar
            </p>
            <Button onClick={handleOpenNew} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Agregar lavadora
            </Button>
          </div>
        ) : (
          washingMachines.map((machine) => (
            <Card key={machine.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                      <WashingMachineIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{machine.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            MachineStatusColors[machine.status || 'disponible']
                          }`}
                        >
                          {MachineStatusLabels[machine.status || 'disponible']}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Weight className="w-3.5 h-3.5" />
                          {machine.kg} kg
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {machine.brand}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(machine)}
                      className="h-9 w-9"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(machine)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Sheet para agregar/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <WashingMachineIcon className="w-5 h-5 text-primary" />
              {editingMachine ? 'Editar Lavadora' : 'Nueva Lavadora'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label>Nombre / Identificador</Label>
              <Input
                placeholder="Ej: Lavadora #1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Capacidad (kg)</Label>
              <Input
                type="number"
                placeholder="Ej: 12"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                placeholder="Ej: Samsung"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(value: MachineStatus) => setStatus(value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="mantenimiento">
                    En Mantenimiento
                  </SelectItem>
                  <SelectItem value="averiada">Averiada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmit} disabled={isSaving} className="w-full h-12 mt-4">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSaving ? 'Guardando...' : editingMachine ? 'Guardar Cambios' : 'Agregar Lavadora'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar lavadora</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar "{machineToDelete?.name}"? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
