import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EXTENSION_OPTIONS } from '@/utils/rentalExtensions';

interface ExtensionFormProps {
  extensionType: 'preset' | 'custom';
  pricingType: 'auto' | 'manual';
  selectedHours: number;
  customHours: string;
  customFee: string;
  calculatedCustomFee: number;
  finalFee: number;
  extensionHours: number;
  currentTotalUsd: number;
  newPickupText: string;
  notes: string;
  onExtensionTypeChange: (value: 'preset' | 'custom') => void;
  onPricingTypeChange: (value: 'auto' | 'manual') => void;
  onSelectedHoursChange: (hours: number) => void;
  onCustomHoursChange: (value: string) => void;
  onCustomFeeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export function ExtensionForm({
  extensionType,
  pricingType,
  selectedHours,
  customHours,
  customFee,
  calculatedCustomFee,
  finalFee,
  extensionHours,
  currentTotalUsd,
  newPickupText,
  notes,
  onExtensionTypeChange,
  onPricingTypeChange,
  onSelectedHoursChange,
  onCustomHoursChange,
  onCustomFeeChange,
  onNotesChange,
}: ExtensionFormProps) {
  return (
    <>
      <div className="space-y-3">
        <Label>Tipo de extensión</Label>
        <RadioGroup
          value={extensionType}
          onValueChange={(value: 'preset' | 'custom') =>
            onExtensionTypeChange(value)
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="preset" id="preset" />
            <Label htmlFor="preset">Opciones predefinidas</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Horas personalizadas</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>Tipo de precio</Label>
        <RadioGroup
          value={pricingType}
          onValueChange={(value: 'auto' | 'manual') =>
            onPricingTypeChange(value)
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="auto" />
            <Label htmlFor="auto">Automático ($3 por cada 8 horas)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Precio manual</Label>
          </div>
        </RadioGroup>
      </div>

      {extensionType === 'preset' && (
        <div className="space-y-3">
          <Label>Seleccionar duración</Label>
          <div className="grid grid-cols-1 gap-2">
            {EXTENSION_OPTIONS.map((option) => (
              <div
                key={option.hours}
                className={cn(
                  'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedHours === option.hours
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50'
                )}
                onClick={() => onSelectedHoursChange(option.hours)}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">
                  ${option.fee.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {extensionType === 'custom' && (
        <div className="space-y-3">
          <Label htmlFor="custom-hours">Horas adicionales</Label>
          <Input
            id="custom-hours"
            type="number"
            min="1"
            max="168"
            value={customHours}
            onChange={(event) => onCustomHoursChange(event.target.value)}
            placeholder="Ej: 12"
          />
          {pricingType === 'auto' && calculatedCustomFee > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Cargo automático: ${calculatedCustomFee.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {pricingType === 'manual' && (
        <div className="space-y-3">
          <Label htmlFor="custom-fee">Precio de extensión (USD)</Label>
          <Input
            id="custom-fee"
            type="number"
            min="0"
            step="0.01"
            value={customFee}
            onChange={(event) => onCustomFeeChange(event.target.value)}
            placeholder="Ej: 5.00"
          />
          <p className="text-xs text-muted-foreground">
            Ingresa el monto exacto que quieres cobrar por esta extensión
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Notas sobre la extensión..."
          rows={3}
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
        <div className="text-sm space-y-1">
          <p className="font-medium">Resumen de extensión:</p>
          <p>
            <span className="text-muted-foreground">Horas adicionales:</span>{' '}
            {extensionType === 'preset' ? selectedHours : customHours || '0'}
          </p>
          <p>
            <span className="text-muted-foreground">Cargo adicional:</span>{' '}
            <span className="font-bold text-primary">
              ${finalFee.toFixed(2)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Nuevo total:</span>{' '}
            <span className="font-bold">
              ${(currentTotalUsd + finalFee).toFixed(2)}
            </span>
          </p>
          {extensionHours > 0 && (
            <p>
              <span className="text-muted-foreground">Nuevo retiro:</span>{' '}
              <span className="font-bold text-primary">{newPickupText}</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
