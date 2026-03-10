import { Loader2, WashingMachine as WashingMachineIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MachineStatus } from '@/types';

interface StatusOption {
  value: MachineStatus;
  label: string;
}

interface WashingMachineFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  name: string;
  kg: string;
  brand: string;
  status: MachineStatus;
  statusOptions: StatusOption[];
  isSaving: boolean;
  onChangeName: (value: string) => void;
  onChangeKg: (value: string) => void;
  onChangeBrand: (value: string) => void;
  onChangeStatus: (value: MachineStatus) => void;
  onSubmit: () => void;
}

export function WashingMachineFormSheet({
  open,
  onOpenChange,
  isEditing,
  name,
  kg,
  brand,
  status,
  statusOptions,
  isSaving,
  onChangeName,
  onChangeKg,
  onChangeBrand,
  onChangeStatus,
  onSubmit,
}: WashingMachineFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px]"
        className="rounded-t-3xl sm:rounded-none"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <WashingMachineIcon className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Lavadora' : 'Nueva Lavadora'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <Label>Nombre / Identificador</Label>
            <Input
              placeholder="Ej: Lavadora #1"
              value={name}
              onChange={(event) => onChangeName(event.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Capacidad (kg)</Label>
            <Input
              type="number"
              placeholder="Ej: 12"
              value={kg}
              onChange={(event) => onChangeKg(event.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Marca</Label>
            <Input
              placeholder="Ej: Samsung"
              value={brand}
              onChange={(event) => onChangeBrand(event.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={onChangeStatus}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className="w-full h-12 mt-4"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isSaving
              ? 'Guardando...'
              : isEditing
              ? 'Guardar Cambios'
              : 'Agregar Lavadora'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
