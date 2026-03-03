import { WashingMachineCard } from './WashingMachineCard';

interface MachineListItem {
  id: string;
  name: string;
  statusLabel: string;
  statusColor: string;
  kgText: string;
  brandText: string;
}

interface WashingMachineListProps {
  items: MachineListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WashingMachineList({
  items,
  onEdit,
  onDelete,
}: WashingMachineListProps) {
  return (
    <div className="space-y-3">
      {items.map((machine) => (
        <WashingMachineCard
          key={machine.id}
          name={machine.name}
          statusLabel={machine.statusLabel}
          statusColor={machine.statusColor}
          kgText={machine.kgText}
          brandText={machine.brandText}
          onEdit={() => onEdit(machine.id)}
          onDelete={() => onDelete(machine.id)}
        />
      ))}
    </div>
  );
}
