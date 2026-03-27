import { AlertCircle } from 'lucide-react';

import { WasherRental } from '@/types';

import { FollowUpRentalCard } from './FollowUpRentalCard';
import { FollowUpSectionHeader } from './FollowUpSectionHeader';

interface FollowUpSectionProps {
  icon: typeof AlertCircle;
  title: string;
  rentals: WasherRental[];
  emptyMessage: string;
  variant?: 'default' | 'warning' | 'info';
  showPaymentStatus?: boolean;
  getMachineName: (machineId: string) => string;
  onExtendRental: (rental: WasherRental) => void;
}

export function FollowUpSection({
  icon,
  title,
  rentals,
  emptyMessage,
  variant,
  showPaymentStatus,
  getMachineName,
  onExtendRental,
}: FollowUpSectionProps) {
  return (
    <section>
      <FollowUpSectionHeader
        icon={icon}
        title={title}
        count={rentals.length}
        variant={variant}
      />
      {rentals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => (
            <FollowUpRentalCard
              key={rental.id}
              rental={rental}
              showPaymentStatus={showPaymentStatus}
              getMachineName={getMachineName}
              onExtendRental={onExtendRental}
            />
          ))}
        </div>
      )}
    </section>
  );
}
