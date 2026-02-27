import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RentalShift } from '@/types';

interface ShiftOption {
  value: RentalShift;
  label: string;
  priceText: string;
}

interface RentalShiftSelectorProps {
  options: ShiftOption[];
  selectedShift: RentalShift;
  onSelect: (shift: RentalShift) => void;
}

export function RentalShiftSelector({
  options,
  selectedShift,
  onSelect,
}: RentalShiftSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Jornada
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={selectedShift === option.value ? 'default' : 'outline'}
            onClick={() => onSelect(option.value)}
            className="h-14 flex flex-col gap-0.5 p-2"
          >
            <span className="text-xs">{option.label}</span>
            <span className="text-sm font-bold">{option.priceText}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
