import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentMethodLabels, WasherRental } from '@/types';

interface RentalCardDetailsProps {
  rental: WasherRental;
  paymentIcon: React.ComponentType<{ className?: string }>;
}

export function RentalCardDetails({
  rental,
  paymentIcon: PaymentIcon,
}: RentalCardDetailsProps) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{rental.customerName}</p>
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{rental.customerAddress}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>
          Entrega: {rental.deliveryTime} → Retiro: {rental.pickupTime}
        </span>
      </div>
      {rental.paymentMethod && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PaymentIcon className="w-4 h-4" />
          <span>{PaymentMethodLabels[rental.paymentMethod]}</span>
        </div>
      )}
      {rental.isPaid && rental.datePaid && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>
            Pagado el:{' '}
            {format(
              parse(rental.datePaid, 'yyyy-MM-dd', new Date()),
              "EEE d 'de' MMM",
              { locale: es }
            )}
          </span>
        </div>
      )}
    </div>
  );
}
