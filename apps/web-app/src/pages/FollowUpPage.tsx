import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { ExtensionDialog } from '@/components/rentals/ExtensionDialog';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import {
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COLUMN_RELAXED_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { useMachineStore } from '@/store/useMachineStore';
import { useRentalStore } from '@/store/useRentalStore';
import { WasherRental } from '@/types';

import { FollowUpFiltersCard } from './FollowUpPage/components/FollowUpFiltersCard';
import { FollowUpPrioritizedList } from './FollowUpPage/components/FollowUpPrioritizedList';

type PaymentFilter = 'paid' | 'unpaid';

export function FollowUpPage() {
  const { isTabletViewport } = useViewportMode();
  const { rentals, updateRental } = useRentalStore();
  const { washingMachines } = useMachineStore();
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<WasherRental | null>(
    null
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter | 'all'>(
    'all'
  );

  const filteredRentals = useMemo(() => {
    return rentals
      .map((rental, index) => ({ rental, index }))
      .filter(({ rental }) => {
        if (rental.status === 'finalizado') {
          return false;
        }

        const paymentKey: PaymentFilter = rental.isPaid ? 'paid' : 'unpaid';

        const matchesPayment =
          paymentFilter === 'all' || paymentFilter === paymentKey;

        return matchesPayment;
      })
      .sort((a, b) => {
        const priorityA = !a.rental.isPaid
          ? 0
          : a.rental.status === 'enviado'
          ? 1
          : 2;
        const priorityB = !b.rental.isPaid
          ? 0
          : b.rental.status === 'enviado'
          ? 1
          : 2;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const dateCompare = a.rental.date.localeCompare(b.rental.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.index - b.index;
      })
      .map(({ rental }) => rental);
  }, [paymentFilter, rentals]);

  const getMachineName = (machineId: string) => {
    const machine = washingMachines.find((m) => m.id === machineId);
    return machine ? `${machine.name} (${machine.kg}kg)` : 'Lavadora';
  };

  const handleExtendRental = (rental: WasherRental) => {
    setSelectedRental(rental);
    setExtensionDialogOpen(true);
  };

  const handleExtensionApplied = async (updatedRental: WasherRental) => {
    try {
      await updateRental(updatedRental.id, updatedRental);
      setSelectedRental(updatedRental);
    } catch (error) {
      console.error('Error al extender alquiler:', error);
      toast.error('Error al extender alquiler');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <AppPageContainer className="space-y-6">
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="followup-primary-column"
              >
                <FollowUpFiltersCard
                  paymentFilter={paymentFilter}
                  onPaymentFilterChange={setPaymentFilter}
                  isTabletViewport
                />

                <FollowUpPrioritizedList
                  rentals={filteredRentals}
                  getMachineName={getMachineName}
                  onExtendRental={handleExtendRental}
                  isTabletViewport
                />
              </div>
            }
            secondary={
              <aside
                className={TABLET_SECONDARY_COLUMN_RELAXED_CLASS}
                data-testid="followup-secondary-column"
              />
            }
          />
        ) : (
          <>
            <FollowUpFiltersCard
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              isTabletViewport={false}
            />

            <FollowUpPrioritizedList
              rentals={filteredRentals}
              getMachineName={getMachineName}
              onExtendRental={handleExtendRental}
              isTabletViewport={false}
            />
          </>
        )}
      </AppPageContainer>

      <ExtensionDialog
        rental={selectedRental}
        open={extensionDialogOpen}
        onOpenChange={setExtensionDialogOpen}
        onExtensionApplied={handleExtensionApplied}
      />
    </div>
  );
}
