import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import { Sale, CartItem } from '@/types';

export type DateRange = 'day' | 'week' | 'month';

export interface LiterBreakdown {
  liters: number;
  count: number;
  totalLiters: number;
  totalBs: number;
}

export interface WaterMetrics {
  totalLiters: number;
  equivalentBottles: number;
  totalBs: number;
  totalUsd: number;
  breakdown: LiterBreakdown[];
  salesCount: number;
}

export interface DateRangeResult {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

function formatDate(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

export function useWaterMetricsViewModel() {
  const { selectedDate, setSelectedDate } = useAppStore();
  const { sales } = useWaterSalesStore();
  const [range, setRange] = useState<DateRange>('day');

  const dateRange = useMemo<DateRangeResult>(() => {
    const selected = new Date(selectedDate + 'T12:00:00');
    let startDate: Date;
    let endDate: Date = new Date(selected);

    switch (range) {
      case 'day':
        startDate = new Date(selected);
        endDate = new Date(selected);
        break;
      case 'week':
        startDate = new Date(selected);
        startDate.setDate(selected.getDate() - selected.getDay());
        endDate = new Date(selected);
        endDate.setDate(selected.getDate() + (6 - selected.getDay()));
        break;
      case 'month':
        startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
        endDate = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
        break;
    }

    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
      startDate,
      endDate,
    };
  }, [selectedDate, range]);

  const filteredSales = useMemo(() => {
    return sales.filter(
      (sale: Sale) => sale.date >= dateRange.start && sale.date <= dateRange.end
    );
  }, [sales, dateRange]);

  const metrics = useMemo<WaterMetrics>(() => {
    let totalLiters = 0;
    let totalBs = 0;
    let totalUsd = 0;
    const literBreakdown: Record<number, LiterBreakdown> = {};

    filteredSales.forEach((sale: Sale) => {
      totalBs += sale.totalBs;
      totalUsd += sale.totalUsd;

      sale.items.forEach((item: CartItem) => {
        if (item.liters && item.quantity) {
          const itemLiters = item.liters * item.quantity;
          totalLiters += itemLiters;

          if (!literBreakdown[item.liters]) {
            literBreakdown[item.liters] = {
              liters: item.liters,
              count: 0,
              totalLiters: 0,
              totalBs: 0,
            };
          }
          literBreakdown[item.liters].count += item.quantity;
          literBreakdown[item.liters].totalLiters += itemLiters;
          literBreakdown[item.liters].totalBs += item.subtotal;
        }
      });
    });

    const breakdownArray = Object.values(literBreakdown).sort(
      (a, b) => a.liters - b.liters
    );
    const equivalentBottles = totalLiters / 19;

    return {
      totalLiters,
      equivalentBottles,
      totalBs,
      totalUsd,
      breakdown: breakdownArray,
      salesCount: filteredSales.length,
    };
  }, [filteredSales]);

  return {
    selectedDate,
    setSelectedDate,
    range,
    setRange,
    dateRange,
    metrics,
  };
}
