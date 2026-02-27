import { WashingMachine as WashingMachineIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WashingMachinesEmptyStateProps {
  onAdd: () => void;
}

export function WashingMachinesEmptyState({
  onAdd,
}: WashingMachinesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <WashingMachineIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">
        No hay lavadoras registradas
      </h3>
      <p className="text-sm text-muted-foreground/70 mt-1">
        Agrega tu primera lavadora para empezar
      </p>
      <Button onClick={onAdd} className="mt-4 gap-2">
        <Plus className="w-4 h-4" />
        Agregar lavadora
      </Button>
    </div>
  );
}
