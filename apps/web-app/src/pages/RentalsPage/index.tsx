import { Header } from '@/components/layout/Header';
import { DateSelector } from '@/components/ventas/DateSelector';

import { RentalSheet } from './components/RentalSheet';
import { RentalsFab } from './components/RentalsFab';
import { RentalList } from './components/RentalList';
import { RentalsSummaryCards } from './components/RentalsSummaryCards';
import { RentalsLoadingState } from './components/RentalsLoadingState';

import { useRentalsPageViewModel } from './hooks/useRentalsPageViewModel';
import { useRentalListViewModel } from './hooks/useRentalListViewModel';

export function RentalsPage() {
  const {
    selectedDate,
    setSelectedDate,
    rentals,
    summary,
    loadingRentals,
    sheetOpen,
    setSheetOpen,
    openSheet,
  } = useRentalsPageViewModel();

  const {
    rentals: sortedRentals,
    editingRental,
    editSheetOpen,
    setEditSheetOpen,
    extensionDialogOpen,
    setExtensionDialogOpen,
    selectedRental,
    handleStatusChange,
    handlePaymentToggle,
    handleEdit,
    handleDelete,
    handleExtendRental,
    handleExtensionApplied,
  } = useRentalListViewModel();

  return (
    <div className="min-h-screen bg-background pb-36">
      <Header title="Alquiler de Lavadoras" />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={loadingRentals}
        />

        {/* Resumen rápido */}
        {rentals.length > 0 ? (
          <RentalsSummaryCards
            activeCount={summary.activeCount}
            totalText={summary.totalText}
            paidText={summary.paidText}
          />
        ) : null}

        {loadingRentals && rentals.length === 0 ? (
          <RentalsLoadingState />
        ) : (
          <RentalList
            rentals={sortedRentals}
            editingRental={editingRental}
            editSheetOpen={editSheetOpen}
            onEditSheetOpenChange={setEditSheetOpen}
            extensionDialogOpen={extensionDialogOpen}
            onExtensionDialogOpenChange={setExtensionDialogOpen}
            selectedRental={selectedRental}
            onStatusChange={handleStatusChange}
            onPaymentToggle={handlePaymentToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExtend={handleExtendRental}
            onExtensionApplied={handleExtensionApplied}
          />
        )}
      </main>

      <RentalsFab onClick={openSheet} />

      <RentalSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
