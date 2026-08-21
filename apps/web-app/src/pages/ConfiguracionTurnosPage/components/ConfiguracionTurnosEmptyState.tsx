import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';

interface ConfiguracionTurnosEmptyStateProps {
  onAdd: () => void;
}

export function ConfiguracionTurnosEmptyState({
  onAdd,
}: ConfiguracionTurnosEmptyStateProps) {
  return (
    <div className="mx-auto max-w-md mt-6 bg-card rounded-2xl p-6 border border-dashed text-center space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Clock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Sin turnos configurados
        </h2>
        <p className="text-sm text-muted-foreground">
          Define el primer turno de tu catálogo para empezar a registrar
          alquileres.
        </p>
      </div>
      <Button onClick={onAdd} className="w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-1" />
        Crear primer turno
      </Button>
    </div>
  );
}
