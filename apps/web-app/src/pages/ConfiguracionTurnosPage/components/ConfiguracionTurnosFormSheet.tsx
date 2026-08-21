import { useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { RentalShiftConfig } from '@aqua-guest/domain';

export interface ShiftFormValues {
  label: string;
  priceUsd: string;
  hours: string;
  hasDivisaDiscount: boolean;
  divisaDiscountAmount: string;
  isActive: boolean;
}

interface ConfiguracionTurnosFormSheetProps {
  open: boolean;
  isEditing: boolean;
  isSaving: boolean;
  initialValues: ShiftFormValues;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onChange: (values: ShiftFormValues) => void;
  onSubmit: () => void;
}

const EMPTY_VALUES: ShiftFormValues = {
  label: '',
  priceUsd: '',
  hours: '',
  hasDivisaDiscount: false,
  divisaDiscountAmount: '1.00',
  isActive: true,
};

export function buildEmptyShiftFormValues(): ShiftFormValues {
  return { ...EMPTY_VALUES };
}

export function buildShiftFormValues(
  shift: RentalShiftConfig
): ShiftFormValues {
  return {
    label: shift.label,
    priceUsd: shift.priceUsd.toString(),
    hours: shift.hours.toString(),
    hasDivisaDiscount: shift.hasDivisaDiscount,
    divisaDiscountAmount: shift.divisaDiscountAmount.toString(),
    isActive: shift.isActive,
  };
}

export function ConfiguracionTurnosFormSheet({
  open,
  isEditing,
  isSaving,
  initialValues,
  errorMessage,
  onOpenChange,
  onChange,
  onSubmit,
}: ConfiguracionTurnosFormSheetProps) {
  // Reset to initial values whenever the sheet opens.
  useEffect(() => {
    if (open) {
      onChange(initialValues);
    }
  }, [open, initialValues, onChange]);

  const handleLabelChange = (value: string) =>
    onChange({ ...initialValues, label: value });
  const handlePriceChange = (value: string) =>
    onChange({ ...initialValues, priceUsd: value });
  const handleHoursChange = (value: string) =>
    onChange({ ...initialValues, hours: value });
  const handleToggleDiscount = (value: boolean) =>
    onChange({ ...initialValues, hasDivisaDiscount: value });
  const handleDiscountAmountChange = (value: string) =>
    onChange({ ...initialValues, divisaDiscountAmount: value });
  const handleToggleActive = (value: boolean) =>
    onChange({ ...initialValues, isActive: value });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px] sm:h-full sm:max-h-screen sm:rounded-none"
        className="rounded-t-3xl max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            {isEditing ? 'Editar Turno' : 'Nuevo Turno'}
          </SheetTitle>
          <SheetDescription>
            Define la duración, el precio y, opcionalmente, un descuento
            automático cuando el cliente paga en divisa.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="shift-label">Nombre</Label>
            <Input
              id="shift-label"
              placeholder="Ej: Completo, Turno nocturno…"
              value={initialValues.label}
              onChange={(event) => handleLabelChange(event.target.value)}
              className="h-12"
              maxLength={40}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shift-hours">Duración (horas)</Label>
              <Input
                id="shift-hours"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="24"
                value={initialValues.hours}
                onChange={(event) => handleHoursChange(event.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-price">Precio base (USD)</Label>
              <Input
                id="shift-price"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="6.00"
                value={initialValues.priceUsd}
                onChange={(event) => handlePriceChange(event.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <Label
                  htmlFor="shift-has-discount"
                  className="text-sm font-medium"
                >
                  Descuento por divisa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aplica un descuento automático cuando el cliente paga en
                  divisa.
                </p>
              </div>
              <Switch
                id="shift-has-discount"
                checked={initialValues.hasDivisaDiscount}
                onCheckedChange={handleToggleDiscount}
              />
            </div>
            {initialValues.hasDivisaDiscount && (
              <div className="space-y-2">
                <Label htmlFor="shift-discount-amount">
                  Monto del descuento (USD)
                </Label>
                <Input
                  id="shift-discount-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  placeholder="1.00"
                  value={initialValues.divisaDiscountAmount}
                  onChange={(event) =>
                    handleDiscountAmountChange(event.target.value)
                  }
                  className="h-12"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="space-y-0.5 min-w-0">
              <Label
                htmlFor="shift-active"
                className="text-sm font-medium"
              >
                Turno activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Los turnos inactivos no aparecen al registrar alquileres.
              </p>
            </div>
            <Switch
              id="shift-active"
              checked={initialValues.isActive}
              onCheckedChange={handleToggleActive}
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1 h-12"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSaving}
              className="flex-1 h-12"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Guardar cambios' : 'Crear turno'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
