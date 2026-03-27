/**
 * PrepaidFormSheet.tsx
 * Bottom sheet for adding / editing a prepaid order.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Droplets, User } from 'lucide-react';
import { PaymentMethod } from '@/types';

interface PrepaidFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrder: string | null;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  liters: string;
  onLitersChange: (v: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (v: PaymentMethod) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
  getPriceForLiters: (liters: number) => number;
}

export function PrepaidFormSheet({
  open,
  onOpenChange,
  editingOrder,
  customerName,
  onCustomerNameChange,
  liters,
  onLitersChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  saving,
  onSubmit,
  getPriceForLiters,
}: PrepaidFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {editingOrder ? 'Editar Prepago' : 'Nuevo Prepago'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto overscroll-contain touch-pan-y max-h-[calc(85vh-120px)] pb-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nombre del Cliente *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Nombre del cliente"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liters">Litros *</Label>
            <div className="relative">
              <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="liters"
                type="number"
                value={liters}
                onChange={(e) => onLitersChange(e.target.value)}
                placeholder="Cantidad de litros"
                className="pl-10"
                min="1"
              />
            </div>
            {liters && (
              <p className="text-sm text-muted-foreground">
                Precio: {getPriceForLiters(Number(liters)).toFixed(2)} Bs
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="punto_venta">Punto de Venta</SelectItem>
                <SelectItem value="divisa">Divisa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={onSubmit}
            disabled={!customerName.trim() || !liters || saving}
            className="w-full"
            size="lg"
          >
            {saving
              ? 'Guardando...'
              : editingOrder
              ? 'Guardar Cambios'
              : 'Registrar Prepago'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
