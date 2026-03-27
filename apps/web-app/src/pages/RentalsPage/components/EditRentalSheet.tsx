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
import { MixedPaymentCard } from '@/components/payments/MixedPaymentCard';
import { TipCaptureCard } from '@/components/tips/TipCaptureCard';

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
  const viewModel = useEditRentalSheetViewModel({ rental, open, onOpenChange });

  if (!rental) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        tabletSide="right"
        tabletClassName="sm:max-w-[480px]"
        className="h-[90vh] rounded-t-3xl sm:h-full sm:rounded-none"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Alquiler
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto overscroll-contain touch-pan-y h-[calc(100%-8rem)] space-y-6 pb-40">
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

          <RentalCustomerSection
            customers={viewModel.customers}
            selectedCustomerId={viewModel.selectedCustomerId || null}
            customerName={viewModel.customerName}
            customerPhone={viewModel.customerPhone}
            customerAddress={viewModel.customerAddress}
            onSelectCustomer={(customerId) =>
              viewModel.onSelectCustomer(customerId ?? '')
            }
            onCreateNewCustomer={() => {
              viewModel.onChangeCustomerName('');
              viewModel.onChangeCustomerPhone('');
              viewModel.onChangeCustomerAddress('');
              viewModel.onSelectCustomer('');
            }}
            onChangeCustomerName={viewModel.onChangeCustomerName}
            onChangeCustomerPhone={viewModel.onChangeCustomerPhone}
            onChangeCustomerAddress={viewModel.onChangeCustomerAddress}
          />

          <TipCaptureCard
            enabled={viewModel.tipEnabled}
            amount={viewModel.tipAmount}
            paymentMethod={viewModel.tipPaymentMethod}
            notes={viewModel.tipNotes}
            onToggle={viewModel.onToggleTip}
            onAmountChange={viewModel.onChangeTipAmount}
            onPaymentMethodChange={viewModel.onChangeTipPaymentMethod}
            onNotesChange={viewModel.onChangeTipNotes}
          />

          {viewModel.isMixedPaymentEnabled && (
            <MixedPaymentCard
              isMixedPayment={viewModel.isMixedPayment}
              onToggle={viewModel.onToggleMixedPayment}
              primaryMethod={viewModel.selectedPaymentMethod}
              secondaryMethod={viewModel.split2Method}
              amountInput={viewModel.split1Amount}
              totalBs={viewModel.totalBs}
              variant="grid"
              amountInputMode="secondary"
              onAmountInputChange={viewModel.onChangeSplit1Amount}
              onSecondaryMethodChange={viewModel.onSelectSplit2Method}
            />
          )}

          <RentalNotesSection
            notes={viewModel.notes}
            onChangeNotes={viewModel.onChangeNotes}
          />
        </div>

        <RentalSheetFooter
          subtotalUsdText={viewModel.subtotalUsdText}
          tipAmountBs={viewModel.tipAmountBs}
          totalUsdText={viewModel.totalUsdText}
          isSaving={viewModel.isLoading}
          onSubmit={viewModel.onSubmit}
        />
      </SheetContent>
    </Sheet>
  );
}
