import { CheckCircle2, ListChecks } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { WasherRental } from '@/types';

import { FollowUpRentalCard } from './FollowUpRentalCard';

interface FollowUpPrioritizedListProps {
  rentals: WasherRental[];
  getMachineName: (machineId: string) => string;
  onExtendRental: (rental: WasherRental) => void;
  isTabletViewport: boolean;
}

export function FollowUpPrioritizedList({
  rentals,
  getMachineName,
  onExtendRental,
  isTabletViewport,
}: FollowUpPrioritizedListProps) {
  const listIcon = isTabletViewport ? ListChecks : CheckCircle2;
  const Icon = listIcon;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Lista priorizada</h2>
        </div>
        <Badge variant="outline">{rentals.length}</Badge>
      </div>

      {rentals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay alquileres que coincidan con los filtros
        </p>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => (
            <FollowUpRentalCard
              key={rental.id}
              rental={rental}
              showPaymentStatus
              getMachineName={getMachineName}
              onExtendRental={onExtendRental}
            />
          ))}
        </div>
      )}
    </section>
  );
}
