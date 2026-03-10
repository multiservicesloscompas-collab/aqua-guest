import {
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Plus,
  WashingMachine,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { canExtendRental } from '@/utils/rentalExtensions';
import { RentalShiftConfig, WasherRental } from '@/types';

interface FollowUpRentalCardProps {
  rental: WasherRental;
  showPaymentStatus?: boolean;
  getMachineName: (machineId: string) => string;
  onExtendRental: (rental: WasherRental) => void;
}

export function FollowUpRentalCard({
  rental,
  showPaymentStatus = false,
  getMachineName,
  onExtendRental,
}: FollowUpRentalCardProps) {
  return (
    <Card className="bg-accent/30 border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <WashingMachine className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">
              {getMachineName(rental.machineId)}
            </span>
          </div>
          <div className="flex gap-1">
            <Badge
              variant={rental.status === 'agendado' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {rental.status === 'agendado' ? 'Agendado' : 'Enviado'}
            </Badge>
            {showPaymentStatus && (
              <Badge variant="destructive" className="text-xs">
                No pagado
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <span className="font-medium">{rental.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            <span>{rental.customerPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{rental.customerAddress}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {rental.deliveryTime} → {rental.pickupTime}
              </span>
            </div>
            <span>{RentalShiftConfig[rental.shift].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{(rental.totalUsd ?? 0).toFixed(2)}</span>
            </div>
            {canExtendRental(rental) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtendRental(rental)}
                className="h-7 px-2 text-xs"
                title="Extender tiempo"
              >
                <Plus className="w-3 h-3 mr-1" />
                Extender
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Fecha:{' '}
          {new Date(rental.date).toLocaleDateString('es-VE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
          {rental.pickupDate !== rental.date && (
            <span className="ml-2">
              → Recogida:{' '}
              {new Date(rental.pickupDate).toLocaleDateString('es-VE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
