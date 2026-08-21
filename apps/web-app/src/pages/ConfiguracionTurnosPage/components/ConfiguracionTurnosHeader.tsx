import { Clock, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfiguracionTurnosHeaderProps {
  count: number;
  isLoading: boolean;
  onAdd: () => void;
  onReload: () => void;
}

export function ConfiguracionTurnosHeader({
  count,
  isLoading,
  onAdd,
  onReload,
}: ConfiguracionTurnosHeaderProps) {
  return (
    <header className="px-4 pt-4 pb-3 max-w-2xl mx-auto w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-tight">
              Turnos de Alquiler
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {count === 0
                ? 'Sin turnos configurados'
                : `${count} turno${count === 1 ? '' : 's'} en el catálogo`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onReload}
            disabled={isLoading}
            className="h-10 w-10"
            aria-label="Recargar turnos"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button onClick={onAdd} className="h-10">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>
    </header>
  );
}
