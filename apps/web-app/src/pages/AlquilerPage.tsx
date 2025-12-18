import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';
import { RentalList } from '@/components/alquiler/RentalList';
import { RentalSheet } from '@/components/alquiler/RentalSheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function AlquilerPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { selectedDate, setSelectedDate, getRentalsByDate } = useAppStore();
  const rentals = getRentalsByDate(selectedDate);

  // Calcular resumen del día
  const activeRentals = rentals.filter((r) => r.status !== 'finalizado').length;
  const totalEarnings = rentals.reduce((sum, r) => sum + r.totalUsd, 0);
  const paidAmount = rentals
    .filter((r) => r.isPaid)
    .reduce((sum, r) => sum + r.totalUsd, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Alquiler de Lavadoras" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
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

        <RentalList />
      </main>

      {/* FAB para agregar */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-40"
        onClick={() => setSheetOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <RentalSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
