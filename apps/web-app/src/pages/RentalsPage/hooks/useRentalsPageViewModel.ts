import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useRentalStore } from '@/store/useRentalStore';
import { WasherRental } from '@/types';
import { rentalsDataService } from '@/services/RentalsDataService';

interface RentalsSummary {
  activeCount: number;
  totalText: string;
  paidText: string;
}

function getSummary(rentals: WasherRental[]): RentalsSummary {
  const activeCount = rentals.filter((r) => r.status !== 'finalizado').length;
  const totalEarnings = rentals.reduce((sum, r) => sum + r.totalUsd, 0);
  const paidAmount = rentals
    .filter((r) => r.isPaid)
    .reduce((sum, r) => sum + r.totalUsd, 0);

  return {
    activeCount,
    totalText: `$${totalEarnings.toFixed(0)}`,
    paidText: `$${paidAmount.toFixed(0)}`,
  };
}

export function useRentalsPageViewModel() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const isFirstLoad = useRef(true);

  const { selectedDate, setSelectedDate } = useAppStore();
  const { getRentalsByDate, loadRentalsByDate } = useRentalStore();

  useEffect(() => {
    if (!selectedDate) return;

    if (isFirstLoad.current) {
      rentalsDataService.invalidateCache(selectedDate);
      isFirstLoad.current = false;
    }

    const cachedRentals = getRentalsByDate(selectedDate);
    if (cachedRentals.length > 0) return;

    setLoadingRentals(true);
    loadRentalsByDate(selectedDate)
      .catch((err) => {
        console.error('Error loading rentals for date:', selectedDate, err);
      })
      .finally(() => {
        setLoadingRentals(false);
      });
  }, [selectedDate, loadRentalsByDate, getRentalsByDate]);

  const rentals = getRentalsByDate(selectedDate);

  const summary = useMemo(() => getSummary(rentals), [rentals]);

  const openSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    rentals,
    summary,
    loadingRentals,
    sheetOpen,
    setSheetOpen,
    openSheet,
  };
}
