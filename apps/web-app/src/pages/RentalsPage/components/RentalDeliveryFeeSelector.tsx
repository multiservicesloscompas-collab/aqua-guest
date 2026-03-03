import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface RentalDeliveryFeeSelectorProps {
  deliveryFeeOptions: number[];
  selectedFee: number;
  onSelect: (fee: number) => void;
}

export function RentalDeliveryFeeSelector({
  deliveryFeeOptions,
  selectedFee,
  onSelect,
}: RentalDeliveryFeeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Cargo de Delivery
      </Label>
      <div className="flex gap-2">
        {deliveryFeeOptions.map((fee) => (
          <Button
            key={fee}
            type="button"
            variant={selectedFee === fee ? 'default' : 'outline'}
            onClick={() => onSelect(fee)}
            className="flex-1 h-10"
          >
            ${fee}
          </Button>
        ))}
      </div>
    </div>
  );
}
