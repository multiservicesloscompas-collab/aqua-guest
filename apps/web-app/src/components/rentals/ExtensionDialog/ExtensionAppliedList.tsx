import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WasherRental } from '@/types';

interface ExtensionAppliedListProps {
  rental: WasherRental;
  onDeleteExtension: (extensionId: string) => void;
}

export function ExtensionAppliedList({
  rental,
  onDeleteExtension,
}: ExtensionAppliedListProps) {
  if (!rental.extensions || rental.extensions.length === 0) {
    return (
      <div className="text-center p-3 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          No hay extensiones aplicadas aún
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Agrega una extensión usando el formulario de abajo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Extensiones aplicadas</Label>
      <div className="space-y-2">
        {rental.extensions.map((extension) => (
          <div key={extension.id} className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm flex-1">
                <p className="font-medium">
                  +{extension.additionalHours} horas
                </p>
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
                  onClick={() => onDeleteExtension(extension.id)}
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
  );
}
