import { Banknote, CreditCard, Smartphone, WashingMachine } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RentalStatus, WasherRental } from '@/types';
import { ExtensionDialog } from '@/components/rentals/ExtensionDialog';
import { useRentalCardViewModel } from '../hooks/useRentalCardViewModel';
import { EditRentalSheet } from './EditRentalSheet';
import { RentalCardDialogs } from './RentalCardDialogs';
import { RentalCardDetails } from './RentalCardDetails';
import { RentalCardFooter } from './RentalCardFooter';
import { RentalCardHeader } from './RentalCardHeader';

interface RentalListProps {
  rentals: WasherRental[];
  editingRental: WasherRental | null;
  editSheetOpen: boolean;
  onEditSheetOpenChange: (open: boolean) => void;
  extensionDialogOpen: boolean;
  onExtensionDialogOpenChange: (open: boolean) => void;
  selectedRental: WasherRental | null;
  onStatusChange: (id: string, status: RentalStatus) => void;
  onPaymentToggle: (id: string, datePaid?: string) => void;
  onEdit: (rental: WasherRental) => void;
  onDelete: (id: string) => void;
  onExtend: (rental: WasherRental) => void;
  onExtensionApplied: (updatedRental: WasherRental) => void;
}

export function RentalList({
  rentals,
  editingRental,
  editSheetOpen,
  onEditSheetOpenChange,
  extensionDialogOpen,
  onExtensionDialogOpenChange,
  selectedRental,
  onStatusChange,
  onPaymentToggle,
  onEdit,
  onDelete,
  onExtend,
  onExtensionApplied,
}: RentalListProps) {
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

  return (
    <>
      <div className="space-y-3">
        {rentals.map((rental) => (
          <RentalListItem
            key={rental.id}
            rental={rental}
            onStatusChange={onStatusChange}
            onPaymentToggle={onPaymentToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onExtend={onExtend}
          />
        ))}
      </div>

      <EditRentalSheet
        rental={editingRental}
        open={editSheetOpen}
        onOpenChange={onEditSheetOpenChange}
      />

      <ExtensionDialog
        rental={selectedRental}
        open={extensionDialogOpen}
        onOpenChange={onExtensionDialogOpenChange}
        onExtensionApplied={onExtensionApplied}
      />
    </>
  );
}

const statusColors: Record<RentalStatus, string> = {
  agendado: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  enviado: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  finalizado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const paymentIcons: Record<string, typeof Banknote> = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
};

interface RentalListItemProps {
  rental: WasherRental;
  onStatusChange: (id: string, status: RentalStatus) => void;
  onPaymentToggle: (id: string, datePaid?: string) => void;
  onEdit: (rental: WasherRental) => void;
  onDelete: (id: string) => void;
  onExtend: (rental: WasherRental) => void;
}

function RentalListItem({
  rental,
  onStatusChange,
  onPaymentToggle,
  onEdit,
  onDelete,
  onExtend,
}: RentalListItemProps) {
  const {
    machine,
    shiftConfig,
    canExtend,
    confirmDialogOpen,
    setConfirmDialogOpen,
    paymentDialogOpen,
    setPaymentDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    statusChangeMessage,
    handleStatusClick,
    handleConfirm,
    handlePaymentClick,
    handlePaymentConfirm,
    handleEditClick,
    handleExtendClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleCopyId,
  } = useRentalCardViewModel({
    rental,
    onStatusChange,
    onPaymentToggle,
    onEdit,
    onDelete,
    onExtend,
  });

  const PaymentIcon = rental.paymentMethod
    ? paymentIcons[rental.paymentMethod] || Banknote
    : Banknote;

  return (
    <>
      <Card
        className={cn(
          'p-4 space-y-3 transition-all active:scale-[0.98] group relative',
          rental.status === 'finalizado' && 'opacity-60'
        )}
      >
        <RentalCardHeader
          rental={rental}
          machineName={machine?.name || `Lavadora #${rental.machineId}`}
          machineDetails={`${
            machine ? `${machine.kg}kg ${machine.brand}` : ''
          } · ${shiftConfig.label}`}
          statusClassName={statusColors[rental.status]}
          onCopyId={handleCopyId}
          onStatusClick={handleStatusClick}
        />

        <RentalCardDetails rental={rental} paymentIcon={PaymentIcon} />

        <RentalCardFooter
          isPaid={rental.isPaid}
          totalUsd={rental.totalUsd ?? 0}
          canExtend={canExtend}
          onPaymentClick={(event) => {
            event.stopPropagation();
            handlePaymentClick();
          }}
          onExtendClick={(event) => {
            event.stopPropagation();
            handleExtendClick();
          }}
          onEditClick={(event) => {
            event.stopPropagation();
            handleEditClick();
          }}
          onDeleteClick={(event) => {
            event.stopPropagation();
            handleDeleteClick();
          }}
        />
      </Card>

      <RentalCardDialogs
        confirmDialogOpen={confirmDialogOpen}
        onConfirmDialogOpenChange={setConfirmDialogOpen}
        paymentDialogOpen={paymentDialogOpen}
        onPaymentDialogOpenChange={setPaymentDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        onDeleteDialogOpenChange={setDeleteDialogOpen}
        onConfirmStatusChange={handleConfirm}
        onConfirmPaymentChange={handlePaymentConfirm}
        onConfirmDelete={handleDeleteConfirm}
        statusChangeMessage={statusChangeMessage}
        isPaid={rental.isPaid}
      />
    </>
  );
}
