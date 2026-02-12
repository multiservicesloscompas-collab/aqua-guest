import { useMemo } from 'react';
import { Sale, WasherRental, ChartDataPoint } from '@/types';

interface UseWeekDataParams {
  selectedDate: string;
  exchangeRate: number;
  sales: Sale[];
  rentals: WasherRental[];
}

/**
 * Hook para calcular los datos de la gráfica semanal
 * Muestra ingresos por día (ventas de agua + alquileres pagados)
 * Los alquileres se filtran por fecha de pago (datePaid), no por fecha de servicio
 */
export function useWeekData({
  selectedDate,
  exchangeRate,
  sales,
  rentals,
}: UseWeekDataParams): ChartDataPoint[] {
  return useMemo((): ChartDataPoint[] => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const selected = new Date(selectedDate + 'T12:00:00');
    const currentDay = selected.getDay();

    return days.map((label, index) => {
      const date = new Date(selected);
      date.setDate(selected.getDate() - (currentDay - index));
      // Construct local date string manually to avoid timezone issues
      const dateStr =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0');

      // Ventas de agua
      const daySales = sales.filter((s: Sale) => s.date === dateStr);
      const waterValue = daySales.reduce(
        (sum: number, s: Sale) => sum + s.totalBs,
        0
      );

      // Alquileres pagados (USD -> Bs), usando SOLO datePaid
      const dayRentals = rentals.filter(
        (r: WasherRental) => r.isPaid && r.datePaid === dateStr
      );
      const rentalValue = dayRentals.reduce(
        (sum: number, r: WasherRental) =>
          sum + r.totalUsd * exchangeRate,
        0
      );

      return { label, value: waterValue + rentalValue, date: dateStr };
    });
  }, [sales, rentals, exchangeRate, selectedDate]);
}
