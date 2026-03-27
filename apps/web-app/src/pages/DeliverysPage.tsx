import { useEffect, useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { useAppStore } from '@/store/useAppStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useRentalStore } from '@/store/useRentalStore';
import {
  TABLET_PRIMARY_COLUMN_COMPACT_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';
import { DateSelector } from '@/components/ventas/DateSelector';

import {
  DeliveryFiltersCard,
  type TimeFilter,
} from './DeliverysPage/components/DeliveryFiltersCard';
import { DeliveryListSection } from './DeliverysPage/components/DeliveryListSection';
import { DeliveryStatsGrid } from './DeliverysPage/components/DeliveryStatsGrid';

export function DeliverysPage() {
  const { isTabletViewport } = useViewportMode();
  const { selectedDate: selectedDateStr, setSelectedDate: setSelectedDateStr } =
    useAppStore();
  const { rentals } = useRentalStore();
  const { washingMachines } = useMachineStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('dia');

  const selectedDate = useMemo(() => {
    return parseISO(selectedDateStr);
  }, [selectedDateStr]);

  useEffect(() => {
    const load = async () => {
      try {
        await useAppStore.getState().loadFromSupabase();
      } catch (err) {
        console.error('Error loading data', err);
      }
    };
    load();
  }, []);

  const filteredRentals = useMemo(() => {
    const now = new Date();

    return rentals
      .filter((rental) => {
        if (!rental.deliveryFee || rental.deliveryFee <= 0) return false;

        const rentalDate = parseISO(rental.date);

        switch (timeFilter) {
          case 'dia':
            return (
              format(rentalDate, 'yyyy-MM-dd') ===
              format(selectedDate, 'yyyy-MM-dd')
            );
          case 'semana': {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            return isWithinInterval(rentalDate, {
              start: weekStart,
              end: weekEnd,
            });
          }
          case 'mes': {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            return isWithinInterval(rentalDate, {
              start: monthStart,
              end: monthEnd,
            });
          }
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.deliveryTime.localeCompare(a.deliveryTime);
      });
  }, [rentals, timeFilter, selectedDate]);

  const getMachineName = (machineId: string) => {
    const machine = washingMachines.find((m) => m.id === machineId);
    return machine ? `${machine.name} (${machine.kg}kg)` : 'Desconocida';
  };

  const stats = useMemo(() => {
    const total = filteredRentals.length;
    const completed = filteredRentals.filter(
      (r) => r.status === 'finalizado'
    ).length;
    const inProgress = filteredRentals.filter(
      (r) => r.status === 'enviado'
    ).length;
    const scheduled = filteredRentals.filter(
      (r) => r.status === 'agendado'
    ).length;
    const totalRevenue = filteredRentals.reduce(
      (sum, r) => sum + (r.deliveryFee || 0),
      0
    );
    const unpaid = filteredRentals.filter((r) => !r.isPaid).length;
    const unpaidAmount = filteredRentals
      .filter((r) => !r.isPaid)
      .reduce((sum, r) => sum + (r.deliveryFee || 0), 0);

    return {
      total,
      completed,
      inProgress,
      scheduled,
      totalRevenue,
      unpaid,
      unpaidAmount,
    };
  }, [filteredRentals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'enviado':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'finalizado':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="pb-24">
      <AppPageContainer>
        {isTabletViewport ? (
          <>
            <TabletSplitLayout
              className={TABLET_SPLIT_LAYOUT_CLASS}
              primary={
                <div
                  className={`${TABLET_PRIMARY_COLUMN_COMPACT_CLASS} space-y-4`}
                  data-testid="delivery-primary-column"
                >
                  <DateSelector
                    selectedDate={selectedDateStr}
                    onDateChange={setSelectedDateStr}
                  />
                  <DeliveryFiltersCard
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                  />
                </div>
              }
              secondary={
                <aside
                  className={TABLET_SECONDARY_COMPLEMENTARY_CLASS}
                  data-testid="delivery-secondary-column"
                >
                  <DeliveryStatsGrid stats={stats} />
                </aside>
              }
            />

            <DeliveryListSection
              rentals={filteredRentals}
              timeFilter={timeFilter}
              selectedDate={selectedDate}
              getMachineName={getMachineName}
              getStatusColor={getStatusColor}
            />
          </>
        ) : (
          <div className="space-y-4">
            <DateSelector
              selectedDate={selectedDateStr}
              onDateChange={setSelectedDateStr}
            />
            <DeliveryFiltersCard
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />

            <DeliveryStatsGrid stats={stats} />

            <DeliveryListSection
              rentals={filteredRentals}
              timeFilter={timeFilter}
              selectedDate={selectedDate}
              getMachineName={getMachineName}
              getStatusColor={getStatusColor}
            />
          </div>
        )}
      </AppPageContainer>
    </div>
  );
}
