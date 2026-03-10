import { Header } from '@/components/layout/Header';
import { AppPageContainer } from '@/components/layout/AppPageContainer';
import { TabletSplitLayout } from '@/components/layout/TabletSplitLayout';
import { DateSelector } from '@/components/ventas/DateSelector';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import {
  TABLET_PRIMARY_CONTROLS_FLOW_CLASS,
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from '@/lib/responsive/tabletLayoutPatterns';

import { RentalSheet } from './components/RentalSheet';
import { RentalsFab } from './components/RentalsFab';
import { RentalList } from './components/RentalList';
import { RentalsSummaryCards } from './components/RentalsSummaryCards';
import { RentalsLoadingState } from './components/RentalsLoadingState';

import { useRentalsPageViewModel } from './hooks/useRentalsPageViewModel';
import { useRentalListViewModel } from './hooks/useRentalListViewModel';

export function RentalsPage() {
  const { isTabletViewport } = useViewportMode();
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

      <AppPageContainer>
        {isTabletViewport ? (
          <TabletSplitLayout
            className={TABLET_SPLIT_LAYOUT_CLASS}
            primary={
              <div
                className={TABLET_PRIMARY_COLUMN_CLASS}
                data-testid="rentals-primary-column"
              >
                <div className={TABLET_PRIMARY_CONTROLS_FLOW_CLASS}>
                  <DateSelector
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    loading={loadingRentals}
                  />

                  {rentals.length > 0 ? (
                    <RentalsSummaryCards
                      activeCount={summary.activeCount}
                      totalText={summary.totalText}
                      paidText={summary.paidText}
                    />
                  ) : null}
                </div>

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
              </div>
            }
            secondary={
              <div
                className={TABLET_SECONDARY_COMPLEMENTARY_CLASS}
                data-testid="rentals-secondary-column"
              />
            }
          />
        ) : (
          <>
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
          </>
        )}
      </AppPageContainer>

      <RentalsFab onClick={openSheet} />

      <RentalSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
