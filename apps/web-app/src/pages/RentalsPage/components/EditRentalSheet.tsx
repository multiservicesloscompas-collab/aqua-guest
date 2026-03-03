import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Pencil } from 'lucide-react';
import { WasherRental } from '@/types';
import { useEditRentalSheetViewModel } from '../hooks/useEditRentalSheetViewModel';
import { RentalMachineSelector } from './RentalMachineSelector';
import { RentalShiftSelector } from './RentalShiftSelector';
import { RentalPaymentMethodSelector } from './RentalPaymentMethodSelector';
import { RentalDeliveryTimeSelector } from './RentalDeliveryTimeSelector';
import { RentalDeliveryFeeSelector } from './RentalDeliveryFeeSelector';
import { RentalCustomerSection } from './RentalCustomerSection';
import { RentalNotesSection } from './RentalNotesSection';
import { RentalSheetFooter } from './RentalSheetFooter';
import { EditRentalStatusPaymentCard } from './EditRentalStatusPaymentCard';

interface EditRentalSheetProps {
  rental: WasherRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRentalSheet({
  rental,
  open,
  onOpenChange,
}: EditRentalSheetProps) {
  const viewModel = useEditRentalSheetViewModel({ rental, onOpenChange });

  if (!rental) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Alquiler
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-8rem)] space-y-6 pb-40">
          <EditRentalStatusPaymentCard
            statusOptions={viewModel.statusOptions}
            status={viewModel.status}
            onChangeStatus={viewModel.onChangeStatus}
            paymentStatus={viewModel.isPaid ? 'paid' : 'pending'}
            onChangePaymentStatus={viewModel.onChangePaymentStatus}
            isPaid={viewModel.isPaid}
            paidDateLabel={viewModel.paidDateLabel}
            datePaid={viewModel.datePaid}
            onChangeDatePaid={viewModel.onChangeDatePaid}
            isCalendarOpen={viewModel.isCalendarOpen}
            onCalendarOpenChange={viewModel.setIsCalendarOpen}
          />

          <RentalMachineSelector
            items={viewModel.machineItems}
            selectedMachineId={viewModel.selectedMachineId}
            onSelect={viewModel.onSelectMachine}
          />

          <RentalShiftSelector
            options={viewModel.shiftOptions}
            selectedShift={viewModel.selectedShift}
            onSelect={viewModel.onSelectShift}
          />

          <RentalPaymentMethodSelector
            options={viewModel.paymentMethodOptions}
            selectedMethod={viewModel.selectedPaymentMethod}
            onSelect={viewModel.onSelectPaymentMethod}
          />

          <RentalDeliveryTimeSelector
            deliveryTime={viewModel.deliveryTime}
            timeSlots={viewModel.timeSlots}
            pickupLabel={viewModel.pickupLabel}
            onSelectDeliveryTime={viewModel.onSelectDeliveryTime}
          />

          <RentalDeliveryFeeSelector
            deliveryFeeOptions={viewModel.deliveryFeeOptions}
            selectedFee={viewModel.deliveryFee}
            onSelect={viewModel.onSelectDeliveryFee}
          />

          <RentalCustomerSection
            customers={viewModel.customers}
            selectedCustomerId={viewModel.selectedCustomerId || null}
            customerName={viewModel.customerName}
            customerPhone={viewModel.customerPhone}
            customerAddress={viewModel.customerAddress}
            onSelectCustomer={(customerId) => {
              if (!customerId) {
                viewModel.onChangeCustomerName('');
                viewModel.onChangeCustomerPhone('');
                viewModel.onChangeCustomerAddress('');
                return;
              }
              viewModel.onSelectCustomer(customerId);
            }}
            onCreateNewCustomer={() => {
              viewModel.onChangeCustomerName('');
              viewModel.onChangeCustomerPhone('');
              viewModel.onChangeCustomerAddress('');
            }}
            onChangeCustomerName={viewModel.onChangeCustomerName}
            onChangeCustomerPhone={viewModel.onChangeCustomerPhone}
            onChangeCustomerAddress={viewModel.onChangeCustomerAddress}
          />

          <RentalNotesSection
            notes={viewModel.notes}
            onChangeNotes={viewModel.onChangeNotes}
          />
        </div>

        <RentalSheetFooter
          totalUsdText={viewModel.totalUsdText}
          isSaving={viewModel.isLoading}
          onSubmit={viewModel.onSubmit}
        />
      </SheetContent>
    </Sheet>
  );
}
