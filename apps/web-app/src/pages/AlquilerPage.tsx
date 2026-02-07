import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
import { RentalList } from '@/components/alquiler/RentalList';
import { RentalSheet } from '@/components/alquiler/RentalSheet';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { WasherRental } from '@/types';

export function AlquilerPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { selectedDate, setSelectedDate, getRentalsByDate, loadRentalsByDate } = useAppStore();
  const [loadingRentals, setLoadingRentals] = useState(false);

  useEffect(() => {
    const today = new Date();
    const formattedDate =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    setSelectedDate(formattedDate);
  }, [setSelectedDate]);

  // Cargar alquileres cuando cambia la fecha - Optimización de rendimiento
  useEffect(() => {
    if (!selectedDate) return;

    // Verificar si ya hay alquileres en caché para esta fecha
    const cachedRentals = getRentalsByDate(selectedDate);

    if (cachedRentals.length > 0) {
      // Ya tenemos datos, no es necesario cargar
      return;
    }

    // Cargar alquileres de la fecha específica
    setLoadingRentals(true);
    loadRentalsByDate(selectedDate)
      .catch(err => {
        console.error('Error loading rentals for date:', selectedDate, err);
      })
      .finally(() => {
        setLoadingRentals(false);
      });
  }, [selectedDate, loadRentalsByDate, getRentalsByDate]);

  const rentals = getRentalsByDate(selectedDate);

  // Calcular resumen del día
  const activeRentals = rentals.filter(
    (r: WasherRental) => r.status !== 'finalizado'
  ).length;
  const totalEarnings = rentals.reduce(
    (sum: number, r: WasherRental) => sum + r.totalUsd,
    0
  );
  const paidAmount = rentals
    .filter((r: WasherRental) => r.isPaid)
    .reduce((sum: number, r: WasherRental) => sum + r.totalUsd, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Alquiler de Lavadoras" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={loadingRentals}
        />

        {/* Resumen rápido */}
        {rentals.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{activeRentals}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">${totalEarnings.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                ${paidAmount.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Cobrado</p>
            </div>
          </div>
        )}

        {loadingRentals && rentals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 mb-3 animate-spin" />
            <p className="text-sm font-medium">Cargando alquileres...</p>
          </div>
        ) : (
          <RentalList />
        )}
      </main>

      {/* FAB para agregar */}
      <Button
        onClick={() => setSheetOpen(true)}
        className={cn(
          'fixed bottom-24 right-4 w-14 h-14 rounded-full gradient-primary shadow-fab z-40',
          'transition-transform hover:scale-105 active:scale-95'
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <RentalSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

