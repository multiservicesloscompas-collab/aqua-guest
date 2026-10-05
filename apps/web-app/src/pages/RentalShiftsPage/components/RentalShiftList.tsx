import type { ShiftListItem } from '../hooks/useRentalShiftsViewModel';
import { RentalShiftCard } from './RentalShiftCard';

interface RentalShiftListProps {
  items: ShiftListItem[];
  canEdit: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RentalShiftList({
  items,
  canEdit,
  onEdit,
  onDelete,
}: RentalShiftListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RentalShiftCard
          key={item.id}
          item={item}
          canEdit={canEdit}
          onEdit={() => onEdit(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
}
