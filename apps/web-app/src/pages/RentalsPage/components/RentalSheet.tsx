import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WashingMachine } from 'lucide-react';
import { useRentalSheetViewModel } from '../hooks/useRentalSheetViewModel';
import { RentalMachineSelector } from './RentalMachineSelector';
import { RentalShiftSelector } from './RentalShiftSelector';
import { RentalPaymentMethodSelector } from './RentalPaymentMethodSelector';
import { RentalDeliveryTimeSelector } from './RentalDeliveryTimeSelector';
import { RentalDeliveryFeeSelector } from './RentalDeliveryFeeSelector';
import { RentalCustomerSection } from './RentalCustomerSection';
import { RentalNotesSection } from './RentalNotesSection';
import { RentalSheetFooter } from './RentalSheetFooter';

interface RentalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RentalSheet({ open, onOpenChange }: RentalSheetProps) {
  const viewModel = useRentalSheetViewModel({ open, onOpenChange });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <WashingMachine className="w-5 h-5 text-primary" />
            Nuevo Alquiler
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-8rem)] space-y-6 pb-40">
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
            onSelectCustomer={viewModel.onSelectCustomer}
            onCreateNewCustomer={viewModel.onCreateNewCustomer}
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
          isSaving={viewModel.isSaving}
          onSubmit={viewModel.onSubmit}
        />
      </SheetContent>
    </Sheet>
  );
}
