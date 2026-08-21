import { Pencil, PowerOff, Tag, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RentalShiftConfig } from '@aqua-guest/domain';

interface ConfiguracionTurnosListProps {
  items: RentalShiftConfig[];
  onEdit: (shift: RentalShiftConfig) => void;
  onToggleActive: (shift: RentalShiftConfig) => void;
  onDelete: (shift: RentalShiftConfig) => void;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDuration(hours: number): string {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} día${days === 1 ? '' : 's'}`;
  }
  return `${hours} hora${hours === 1 ? '' : 's'}`;
}

export function ConfiguracionTurnosList({
  items,
  onEdit,
  onToggleActive,
  onDelete,
}: ConfiguracionTurnosListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((shift) => (
        <Card
          key={shift.id}
          className={shift.isActive ? '' : 'opacity-70 border-dashed'}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {shift.label}
                  </h3>
                  {!shift.isActive && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inactivo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(shift.hours)} · {formatPrice(shift.priceUsd)}
                </p>
              </div>
              <Switch
                checked={shift.isActive}
                onCheckedChange={() => onToggleActive(shift)}
                aria-label={`Activar o desactivar ${shift.label}`}
              />
            </div>

            {shift.hasDivisaDiscount && (
              <div className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-2 text-xs">
                Descuento por divisa: ${shift.divisaDiscountAmount.toFixed(2)}
              </div>
            )}

            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(shift)}
                aria-label={`Editar ${shift.label}`}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(shift)}
                className="text-destructive hover:bg-destructive/10"
                aria-label={`Eliminar ${shift.label}`}
              >
                {shift.isActive ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-1" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
