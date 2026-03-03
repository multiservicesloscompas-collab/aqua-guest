import { WashingMachine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface MachineItem {
  id: string;
  name: string;
  detail: string;
  isUnavailable: boolean;
}

interface RentalMachineSelectorProps {
  items: MachineItem[];
  selectedMachineId: string;
  onSelect: (machineId: string) => void;
}

export function RentalMachineSelector({
  items,
  selectedMachineId,
  onSelect,
}: RentalMachineSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <WashingMachine className="w-4 h-4" />
        Lavadora
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {items.length === 0 ? (
          <p className="col-span-3 text-center text-muted-foreground py-4">
            No hay lavadoras registradas. Agrega una desde el menú.
          </p>
        ) : (
          items.map((machine) => (
            <Button
              key={machine.id}
              type="button"
              variant={selectedMachineId === machine.id ? 'default' : 'outline'}
              disabled={machine.isUnavailable}
              onClick={() => onSelect(machine.id)}
              className="h-16 text-sm relative flex flex-col gap-0.5 p-2"
            >
              <span className="font-medium">{machine.name}</span>
              <span className="text-xs opacity-70">{machine.detail}</span>
              {machine.isUnavailable && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 text-[10px] px-1"
                >
                  Ocupada
                </Badge>
              )}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
