/**
 * CustomerFormSheet.tsx
 * Bottom sheet for adding / editing a customer.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Pencil, UserPlus, Loader2 } from 'lucide-react';

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer: string | null;
  newName: string;
  onNameChange: (v: string) => void;
  newPhone: string;
  onPhoneChange: (v: string) => void;
  newAddress: string;
  onAddressChange: (v: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function CustomerFormSheet({
  open,
  onOpenChange,
  editingCustomer,
  newName,
  onNameChange,
  newPhone,
  onPhoneChange,
  newAddress,
  onAddressChange,
  isSaving,
  onSave,
  onReset,
}: CustomerFormSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onReset();
        onOpenChange(isOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            {editingCustomer ? (
              <>
                <Pencil className="w-5 h-5 text-primary" />
                Editar Cliente
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-primary" />
                Nuevo Cliente
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              placeholder="Número de teléfono"
              type="tel"
              value={newPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              placeholder="Dirección"
              value={newAddress}
              onChange={(e) => onAddressChange(e.target.value)}
              className="h-12"
            />
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full h-12 text-base font-semibold"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isSaving ? (
              'Guardando...'
            ) : editingCustomer ? (
              <>
                <Pencil className="w-5 h-5 mr-2" />
                Guardar Cambios
              </>
            ) : (
              'Guardar Cliente'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
