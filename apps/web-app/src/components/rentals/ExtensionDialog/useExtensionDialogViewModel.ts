import { useCallback, useMemo, useState } from 'react';
import { WasherRental } from '@/types';
import {
  applyExtensionToRental,
  calculateExtendedPickupTime,
  calculateExtensionFee,
  canExtendRental,
  createRentalExtension,
  removeExtensionFromRental,
} from '@/utils/rentalExtensions';

type ExtensionType = 'preset' | 'custom';
type PricingType = 'auto' | 'manual';

interface ExtensionDialogViewModelInput {
  rental: WasherRental | null;
  onOpenChange: (open: boolean) => void;
  onExtensionApplied: (updatedRental: WasherRental) => void;
}

export function useExtensionDialogViewModel({
  rental,
  onOpenChange,
  onExtensionApplied,
}: ExtensionDialogViewModelInput) {
  const [selectedHours, setSelectedHours] = useState(8);
  const [customHours, setCustomHours] = useState('');
  const [customFee, setCustomFee] = useState('');
  const [extensionType, setExtensionType] = useState<ExtensionType>('preset');
  const [pricingType, setPricingType] = useState<PricingType>('auto');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRender =
    Boolean(rental) && Boolean(rental && canExtendRental(rental));
  const canAddExtension = rental ? rental.status !== 'finalizado' : false;

  const currentFee = calculateExtensionFee(selectedHours);
  const calculatedCustomFee = customHours
    ? calculateExtensionFee(Number(customHours))
    : 0;

  const finalFee =
    pricingType === 'manual'
      ? Number(customFee)
      : extensionType === 'preset'
      ? currentFee
      : calculatedCustomFee;

  const extensionHours =
    extensionType === 'preset'
      ? selectedHours
      : customHours
      ? Number(customHours)
      : 0;

  const newPickupInfo = useMemo(() => {
    if (!rental) return { pickupTime: '', pickupDate: '' };
    if (extensionHours <= 0) {
      return { pickupTime: rental.pickupTime, pickupDate: rental.pickupDate };
    }

    return calculateExtendedPickupTime(
      rental.pickupDate,
      rental.pickupTime,
      extensionHours
    );
  }, [extensionHours, rental]);

  const resetForm = useCallback(() => {
    setSelectedHours(8);
    setCustomHours('');
    setCustomFee('');
    setNotes('');
    setExtensionType('preset');
    setPricingType('auto');
  }, []);

  const handleDeleteExtension = useCallback(
    (extensionId: string) => {
      if (!rental) return;
      const updatedRental = removeExtensionFromRental(rental, extensionId);
      onExtensionApplied(updatedRental);
    },
    [onExtensionApplied, rental]
  );

  const handleSubmit = useCallback(async () => {
    if (!rental) return;

    setIsSubmitting(true);
    try {
      const hours =
        extensionType === 'preset' ? selectedHours : Number(customHours);

      if (hours <= 0) {
        return;
      }

      const extension = createRentalExtension(
        rental.id,
        hours,
        notes || undefined
      );

      if (pricingType === 'manual') {
        extension.additionalFee = Number(customFee);
      }

      const updatedRental = applyExtensionToRental(rental, extension);
      onExtensionApplied(updatedRental);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error applying extension:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    customFee,
    customHours,
    extensionType,
    notes,
    onExtensionApplied,
    onOpenChange,
    pricingType,
    rental,
    resetForm,
    selectedHours,
  ]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const isSubmitDisabled =
    isSubmitting ||
    (extensionType === 'custom' &&
      (!customHours || Number(customHours) <= 0)) ||
    (pricingType === 'manual' && (!customFee || Number(customFee) <= 0));

  return {
    rental,
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
    currentFee,
    calculatedCustomFee,
    finalFee,
    extensionHours,
    newPickupInfo,
    isSubmitDisabled,
    handleDeleteExtension,
    handleSubmit,
    handleCancel,
  };
}
