import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { RentalCard } from './RentalCard';
import { EditRentalSheet } from './EditRentalSheet';
import { WashingMachine } from 'lucide-react';
import { RentalStatus, WasherRental } from '@/types';
import { toast } from 'sonner';

export function RentalList() {
  const { selectedDate, getRentalsByDate, updateRental, deleteRental } = useAppStore();
  const rentals = getRentalsByDate(selectedDate);
  const [editingRental, setEditingRental] = useState<WasherRental | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  
  const handleStatusChange = (id: string, status: RentalStatus) => {
    updateRental(id, { status });
  };
  
  const handlePaymentToggle = (id: string) => {
    const rental = rentals.find(r => r.id === id);
    if (rental) {
      updateRental(id, { isPaid: !rental.isPaid });
    }
  };

  const handleEdit = (rental: WasherRental) => {
    setEditingRental(rental);
    setEditSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteRental(id);
    toast.success('Alquiler eliminado');
  };
  
  if (rentals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <WashingMachine className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Sin alquileres</p>
        <p className="text-sm text-muted-foreground/70">
          Toca el botón + para agregar
        </p>
      </div>
    );
  }
  
  // Ordenar: activos primero, finalizados al final
  const sortedRentals = [...rentals].sort((a, b) => {
    const statusOrder = { agendado: 0, enviado: 1, finalizado: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
  
  return (
    <>
      <div className="space-y-3">
        {sortedRentals.map((rental) => (
          <RentalCard
            key={rental.id}
            rental={rental}
            onStatusChange={handleStatusChange}
            onPaymentToggle={handlePaymentToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <EditRentalSheet
        rental={editingRental}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />
    </>
  );
}
