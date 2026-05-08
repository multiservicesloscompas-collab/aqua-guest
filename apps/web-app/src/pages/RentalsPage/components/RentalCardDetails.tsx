import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { WasherRental } from '@/types';
import type { PaymentDisplayModel } from '@/services/payments/paymentDisplayModel';
import { deriveRentalTipAmountBs } from '@/services/transactions/transactionTotals';
import { useConfigStore } from '@/store/useConfigStore';
import type { Tip } from '@/types/tips';

interface RentalCardDetailsProps {
  rental: WasherRental;
  tip?: Tip;
  paymentIcon: React.ComponentType<{ className?: string }>;
  paymentDisplay: PaymentDisplayModel;
}

export function RentalCardDetails({
  rental,
  tip,
  paymentIcon: PaymentIcon,
  paymentDisplay,
}: RentalCardDetailsProps) {
  const exchangeRate = useConfigStore((state) => state.config.exchangeRate);
  const baseUsd =
    rental.shift === 'completo' && rental.paymentMethod === 'divisa'
      ? 5
      : rental.shift === 'medio'
      ? 4
      : rental.shift === 'completo'
      ? 6
      : 12;
  const subtotalUsd = baseUsd + Number(rental.deliveryFee || 0);
  const tipAmountBs =
    tip?.amountBs ??
    deriveRentalTipAmountBs(rental.totalUsd, subtotalUsd, exchangeRate);
  const displaySubtotalUsd = Math.max(
    0,
    Number(rental.totalUsd || 0) -
      (exchangeRate > 0 ? tipAmountBs / exchangeRate : 0)
  );

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
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <PaymentIcon className="w-4 h-4" />
            <span>{paymentDisplay.label}</span>
          </div>

          {paymentDisplay.kind === 'mixed' && (
            <div
              className="ml-6 space-y-0.5"
              data-testid={`rental-mixed-breakdown-${rental.id}`}
            >
              {paymentDisplay.lines.map((line) => (
                <p key={`${rental.id}-${line.method}`} className="text-[11px]">
                  {line.label}: Bs {line.amountBs.toFixed(2)} • $
                  {line.amountUsd.toFixed(2)}
                </p>
              ))}
            </div>
          )}
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
      {tipAmountBs > 0 && (
        <p className="text-xs text-muted-foreground">
          Subtotal ${displaySubtotalUsd.toFixed(2)} + Propina Bs{' '}
          {tipAmountBs.toFixed(2)}
        </p>
      )}
    </div>
  );
}
