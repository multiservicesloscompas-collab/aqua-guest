import { Calendar, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RentalDeliveryTimeSelectorProps {
  deliveryTime: string;
  timeSlots: string[];
  pickupLabel: string;
  onSelectDeliveryTime: (time: string) => void;
}

export function RentalDeliveryTimeSelector({
  deliveryTime,
  timeSlots,
  pickupLabel,
  onSelectDeliveryTime,
}: RentalDeliveryTimeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Hora de Entrega
      </Label>
      <Select value={deliveryTime} onValueChange={onSelectDeliveryTime}>
        <SelectTrigger className="h-12">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeSlots.map((slot) => (
            <SelectItem key={slot} value={slot}>
              {slot}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="bg-accent/50 rounded-lg p-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <div className="text-sm">
          <span className="text-muted-foreground">Retiro: </span>
          <span className="font-medium">{pickupLabel}</span>
        </div>
      </div>
    </div>
  );
}
