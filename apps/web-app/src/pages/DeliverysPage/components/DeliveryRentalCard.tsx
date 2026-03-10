import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, MapPin, Phone, User, WashingMachine } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RentalShiftConfig, RentalStatusLabels, WasherRental } from '@/types';

interface DeliveryRentalCardProps {
  rental: WasherRental;
  getMachineName: (machineId: string) => string;
  getStatusColor: (status: string) => string;
}

export function DeliveryRentalCard({
  rental,
  getMachineName,
  getStatusColor,
}: DeliveryRentalCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <WashingMachine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{getMachineName(rental.machineId)}</p>
              <p className="text-sm text-muted-foreground">
                {RentalShiftConfig[rental.shift].label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={cn('border', getStatusColor(rental.status))}>
              {RentalStatusLabels[rental.status]}
            </Badge>
            <p className="text-sm font-semibold text-primary mt-1">
              ${(rental.deliveryFee || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{rental.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{rental.customerPhone}</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            {rental.customerAddress}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm bg-accent/50 rounded-lg p-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              Entrega: <strong>{rental.deliveryTime}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              Recogida: <strong>{rental.pickupTime}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            {format(parseISO(rental.date), "EEEE d 'de' MMMM, yyyy", {
              locale: es,
            })}
          </span>
          <Badge
            variant={rental.isPaid ? 'default' : 'destructive'}
            className="text-xs"
          >
            {rental.isPaid ? 'Pagado' : 'No pagado'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
