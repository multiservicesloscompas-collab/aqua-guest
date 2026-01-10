import { useState, useMemo } from 'react';
import { WasherRental, RentalExtension } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, DollarSign, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EXTENSION_OPTIONS,
  calculateExtensionFee,
  createRentalExtension,
  applyExtensionToRental,
  canExtendRental,
  removeExtensionFromRental,
  calculateExtendedPickupTime,
} from '@/utils/rentalExtensions';
import { Badge } from '@/components/ui/badge';

interface ExtensionDialogProps {
  rental: WasherRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtensionApplied: (updatedRental: WasherRental) => void;
}

export function ExtensionDialog({
  rental,
  open,
  onOpenChange,
  onExtensionApplied,
}: ExtensionDialogProps) {
  const [selectedHours, setSelectedHours] = useState<number>(8);
  const [customHours, setCustomHours] = useState<string>('');
  const [customFee, setCustomFee] = useState<string>('');
  const [extensionType, setExtensionType] = useState<'preset' | 'custom'>('preset');
  const [pricingType, setPricingType] = useState<'auto' | 'manual'>('auto');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!rental || (!canExtendRental(rental))) {
    return null;
  }

  const canAddExtension = rental.status !== 'finalizado';

  const currentFee = calculateExtensionFee(selectedHours);
  const calculatedCustomFee = customHours ? calculateExtensionFee(Number(customHours)) : 0;
  const finalFee = pricingType === 'manual' ? Number(customFee) : (extensionType === 'preset' ? currentFee : calculatedCustomFee);

  // Calcular la nueva hora de retiro para mostrar en el resumen
  const newPickupInfo = useMemo(() => {
    const hours = extensionType === 'preset' ? selectedHours : (customHours ? Number(customHours) : 0);
    if (hours <= 0) return { pickupTime: rental.pickupTime, pickupDate: rental.pickupDate };
    
    return calculateExtendedPickupTime(
      rental.pickupDate,
      rental.pickupTime,
      hours
    );
  }, [rental.pickupDate, rental.pickupTime, selectedHours, customHours, extensionType]);

  const handleDeleteExtension = (extensionId: string) => {
    if (!rental) return;
    
    console.log('Deleting extension:', extensionId);
    const updatedRental = removeExtensionFromRental(rental, extensionId);
    console.log('Updated rental after deletion:', updatedRental);
    onExtensionApplied(updatedRental);
  };

  const handleSubmit = async () => {
    if (!rental) return;

    setIsSubmitting(true);
    try {
      const hours = extensionType === 'preset' ? selectedHours : Number(customHours);
      
      if (hours <= 0) {
        return;
      }

      const extension = createRentalExtension(rental.id, hours, notes || undefined);
      
      // Si el precio es manual, actualizar el cargo adicional
      if (pricingType === 'manual') {
        extension.additionalFee = Number(customFee);
      }
      
      const updatedRental = applyExtensionToRental(rental, extension);
      
      onExtensionApplied(updatedRental);
      onOpenChange(false);
      
      // Reset form
      setSelectedHours(8);
      setCustomHours('');
      setCustomFee('');
      setNotes('');
      setExtensionType('preset');
      setPricingType('auto');
    } catch (error) {
      console.error('Error applying extension:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedHours(8);
    setCustomHours('');
    setCustomFee('');
    setNotes('');
    setExtensionType('preset');
    setPricingType('auto');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Extender Tiempo de Alquiler
          </DialogTitle>
          <DialogDescription>
            Agregar tiempo adicional al alquiler de {rental.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-1">
          {/* Información actual */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Retiro actual:</span>{' '}
                {rental.pickupTime} ({rental.pickupDate})
              </p>
              <p>
                <span className="font-medium">Total actual:</span> ${rental.totalUsd.toFixed(2)}
              </p>
              {rental.extensions && rental.extensions.length > 0 && (
                <p className="text-amber-600">
                  Ya tiene {rental.extensions.length} extensión(es)
                </p>
              )}
            </div>
          </div>

          {/* Extensiones existentes */}
          {rental.extensions && rental.extensions.length > 0 ? (
            <div className="space-y-3">
              <Label>Extensiones aplicadas</Label>
              <div className="space-y-2">
                {rental.extensions.map((extension, index) => (
                  <div key={extension.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm flex-1">
                        <p className="font-medium">+{extension.additionalHours} horas</p>
                        <p className="text-muted-foreground">
                          ${extension.additionalFee.toFixed(2)}
                        </p>
                        {extension.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {extension.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExtension(extension.id)}
                          className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
                          title="Eliminar extensión"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No hay extensiones aplicadas aún
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega una extensión usando el formulario de abajo
              </p>
            </div>
          )}

          {/* Formulario para agregar nueva extensión */}
          {canAddExtension && (
            <>
              {/* Tipo de extensión */}
              <div className="space-y-3">
                <Label>Tipo de extensión</Label>
                <RadioGroup value={extensionType} onValueChange={(value: 'preset' | 'custom') => setExtensionType(value)}>
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

              {/* Tipo de precio */}
              <div className="space-y-3">
                <Label>Tipo de precio</Label>
                <RadioGroup value={pricingType} onValueChange={(value: 'auto' | 'manual') => setPricingType(value)}>
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

              {/* Opciones predefinidas */}
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
                        onClick={() => setSelectedHours(option.hours)}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground">${option.fee.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horas personalizadas */}
              {extensionType === 'custom' && (
                <div className="space-y-3">
                  <Label htmlFor="custom-hours">Horas adicionales</Label>
                  <Input
                    id="custom-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
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

              {/* Precio manual */}
              {pricingType === 'manual' && (
                <div className="space-y-3">
                  <Label htmlFor="custom-fee">Precio de extensión (USD)</Label>
                  <Input
                    id="custom-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customFee}
                    onChange={(e) => setCustomFee(e.target.value)}
                    placeholder="Ej: 5.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa el monto exacto que quieres cobrar por esta extensión
                  </p>
                </div>
              )}

              {/* Notas */}
              <div className="space-y-3">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre la extensión..."
                  rows={3}
                />
              </div>

              {/* Resumen */}
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <p className="font-medium">Resumen de extensión:</p>
                  <p>
                    <span className="text-muted-foreground">Horas adicionales:</span>{' '}
                    {extensionType === 'preset' ? selectedHours : (customHours || '0')}
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
                      ${(rental.totalUsd + finalFee).toFixed(2)}
                    </span>
                  </p>
                  {(extensionType === 'preset' ? selectedHours : (customHours ? Number(customHours) : 0)) > 0 && (
                    <p>
                      <span className="text-muted-foreground">Nuevo retiro:</span>{' '}
                      <span className="font-bold text-primary">
                        {newPickupInfo.pickupDate === rental.pickupDate 
                          ? `Hoy a las ${newPickupInfo.pickupTime}`
                          : `${new Date(newPickupInfo.pickupDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} a las ${newPickupInfo.pickupTime}`
                        }
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Mensaje para alquileres finalizados sin extensiones */}
          {!canAddExtension && (!rental.extensions || rental.extensions.length === 0) && (
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Este alquiler está finalizado y no tiene extensiones aplicadas
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (extensionType === 'custom' && (!customHours || Number(customHours) <= 0)) || (pricingType === 'manual' && (!customFee || Number(customFee) <= 0))}
          >
            {isSubmitting ? (
              'Aplicando...'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Aplicar Extensión
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
