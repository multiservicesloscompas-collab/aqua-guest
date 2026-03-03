import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WasherRental } from '@/types';
import { ExtensionAppliedList } from './ExtensionAppliedList';
import { ExtensionCurrentInfo } from './ExtensionCurrentInfo';
import { ExtensionDialogFooter } from './ExtensionDialogFooter';
import { ExtensionDialogHeader } from './ExtensionDialogHeader';
import { ExtensionForm } from './ExtensionForm';
import { useExtensionDialogViewModel } from './useExtensionDialogViewModel';

interface ExtensionDialogProps {
  rental: WasherRental | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtensionApplied: (updatedRental: WasherRental) => void;
}

export function ExtensionDialog({
  rental,
  open,
  onOpenChange,
  onExtensionApplied,
}: ExtensionDialogProps) {
  const {
    canRender,
    canAddExtension,
    selectedHours,
    setSelectedHours,
    customHours,
    setCustomHours,
    customFee,
    setCustomFee,
    extensionType,
    setExtensionType,
    pricingType,
    setPricingType,
    notes,
    setNotes,
    isSubmitting,
    calculatedCustomFee,
    finalFee,
    extensionHours,
    newPickupInfo,
    isSubmitDisabled,
    handleDeleteExtension,
    handleSubmit,
    handleCancel,
  } = useExtensionDialogViewModel({
    rental,
    onOpenChange,
    onExtensionApplied,
  });

  if (!canRender || !rental) {
    return null;
  }

  const newPickupText =
    newPickupInfo.pickupDate === rental.pickupDate
      ? `Hoy a las ${newPickupInfo.pickupTime}`
      : `${new Date(newPickupInfo.pickupDate).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })} a las ${newPickupInfo.pickupTime}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <ExtensionDialogHeader customerName={rental.customerName} />

        <div className="flex-1 overflow-y-auto space-y-6 py-1">
          <ExtensionCurrentInfo rental={rental} />

          <ExtensionAppliedList
            rental={rental}
            onDeleteExtension={handleDeleteExtension}
          />

          {canAddExtension && (
            <ExtensionForm
              extensionType={extensionType}
              pricingType={pricingType}
              selectedHours={selectedHours}
              customHours={customHours}
              customFee={customFee}
              calculatedCustomFee={calculatedCustomFee}
              finalFee={finalFee}
              extensionHours={extensionHours}
              currentTotalUsd={rental.totalUsd}
              newPickupText={newPickupText}
              notes={notes}
              onExtensionTypeChange={setExtensionType}
              onPricingTypeChange={setPricingType}
              onSelectedHoursChange={setSelectedHours}
              onCustomHoursChange={setCustomHours}
              onCustomFeeChange={setCustomFee}
              onNotesChange={setNotes}
            />
          )}

          {!canAddExtension &&
            (!rental.extensions || rental.extensions.length === 0) && (
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Este alquiler está finalizado y no tiene extensiones aplicadas
                </p>
              </div>
            )}
        </div>

        <ExtensionDialogFooter
          isSubmitting={isSubmitting}
          isSubmitDisabled={isSubmitDisabled}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
