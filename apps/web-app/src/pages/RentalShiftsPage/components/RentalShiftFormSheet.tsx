import { Clock, Loader2 } from 'lucide-react';
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
import type { ShiftFormValues } from '../hooks/rentalShiftsViewModel.helpers';

interface RentalShiftFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  values: ShiftFormValues;
  errors: string[];
  codePreview: string | undefined;
  isSaving: boolean;
  onChange: (values: ShiftFormValues) => void;
  onSubmit: () => void;
}

export function RentalShiftFormSheet({
  open,
  onOpenChange,
  isEditing,
  values,
  errors,
  codePreview,
  isSaving,
  onChange,
  onSubmit,
}: RentalShiftFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[440px] sm:h-full sm:max-h-screen sm:rounded-none"
        className="rounded-t-3xl max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Turno' : 'Nuevo Turno'}
          </SheetTitle>
          <SheetDescription>
            Define la duración y el precio. Los alquileres ya registrados no
            cambian.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="shift-form-label">Nombre</Label>
            <Input
              id="shift-form-label"
              placeholder="Ej: Turno nocturno"
              data-testid="shift-form-label"
              value={values.label}
              maxLength={40}
              onChange={(event) =>
                onChange({ ...values, label: event.target.value })
              }
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Código:{' '}
              <span className="font-mono" data-testid="shift-form-code-preview">
                {codePreview ?? '—'}
              </span>
              {isEditing ? ' (no cambia al editar)' : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shift-form-hours">Duración (horas)</Label>
              <Input
                id="shift-form-hours"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="24"
                data-testid="shift-form-hours"
                value={values.hours}
                onChange={(event) =>
                  onChange({ ...values, hours: event.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-form-price">Precio (USD)</Label>
              <Input
                id="shift-form-price"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="6.00"
                data-testid="shift-form-price"
                value={values.priceUsd}
                onChange={(event) =>
                  onChange({ ...values, priceUsd: event.target.value })
                }
                className="h-12"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="shift-form-discount-toggle">
                  Descuento por divisa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se resta del precio cuando el cliente paga en divisa.
                </p>
              </div>
              <Switch
                id="shift-form-discount-toggle"
                data-testid="shift-form-discount-toggle"
                checked={values.hasDivisaDiscount}
                onCheckedChange={(checked) =>
                  onChange({ ...values, hasDivisaDiscount: checked })
                }
              />
            </div>
            {values.hasDivisaDiscount && (
              <div className="space-y-2">
                <Label htmlFor="shift-form-discount">
                  Monto del descuento (USD)
                </Label>
                <Input
                  id="shift-form-discount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  placeholder="1.00"
                  data-testid="shift-form-discount"
                  value={values.divisaDiscountUsd}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      divisaDiscountUsd: event.target.value,
                    })
                  }
                  className="h-12"
                />
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <ul
              role="alert"
              data-testid="shift-form-errors"
              className="space-y-1 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
            >
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          <Button
            onClick={onSubmit}
            disabled={isSaving}
            data-testid="shift-form-submit"
            className="w-full h-12 mt-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isSaving
              ? 'Guardando...'
              : isEditing
              ? 'Guardar Cambios'
              : 'Agregar Turno'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
