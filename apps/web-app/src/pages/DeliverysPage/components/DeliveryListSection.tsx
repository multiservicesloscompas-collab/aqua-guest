import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Truck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { WasherRental } from '@/types';

import { DeliveryRentalCard } from './DeliveryRentalCard';
import { TimeFilter } from './DeliveryFiltersCard';

interface DeliveryListSectionProps {
  rentals: WasherRental[];
  timeFilter: TimeFilter;
  selectedDate: Date;
  getMachineName: (machineId: string) => string;
  getStatusColor: (status: string) => string;
}

export function DeliveryListSection({
  rentals,
  timeFilter,
  selectedDate,
  getMachineName,
  getStatusColor,
}: DeliveryListSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">
        {timeFilter === 'dia' &&
          `Entregas del ${format(selectedDate, "d 'de' MMMM", {
            locale: es,
          })}`}
        {timeFilter === 'semana' && 'Entregas de esta semana'}
        {timeFilter === 'mes' && 'Entregas de este mes'}
      </h3>

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No hay entregas en este período
            </p>
          </CardContent>
        </Card>
      ) : (
        rentals.map((rental) => (
          <DeliveryRentalCard
            key={rental.id}
            rental={rental}
            getMachineName={getMachineName}
            getStatusColor={getStatusColor}
          />
        ))
      )}
    </div>
  );
}
