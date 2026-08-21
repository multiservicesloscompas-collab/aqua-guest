import type {
  RentalShiftConfig,
  RentalShiftConfigDraft,
  RentalShiftConfigUpdate,
} from '@aqua-guest/domain';
import {
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildShiftBusinessKey = (id: string) => `rentalShift:${id}`;

export const enqueueOfflineRentalShiftCreate = (
  shift: RentalShiftConfigDraft,
  actionSource = 'rentals/addShift'
): RentalShiftConfig => {
  const tempId = generateTempId();
  const businessKey = buildShiftBusinessKey(tempId);

  enqueueOfflineRepositoryCreate({
    table: 'rental_shifts',
    repository: 'rentalShifts',
    input: {
      tempId,
      ...shift,
    },
    payload: {
      tempId,
      label: shift.label,
      price_usd: shift.priceUsd,
      hours: shift.hours,
      has_divisa_discount: shift.hasDivisaDiscount,
      divisa_discount_amount: shift.divisaDiscountAmount,
      is_active: shift.isActive,
    },
    enqueueSource: actionSource,
    businessKey,
  });

  return {
    id: tempId,
    ...shift,
  };
};

export const enqueueOfflineRentalShiftUpdate = (
  id: string,
  updates: RentalShiftConfigUpdate,
  actionSource = 'rentals/updateShift'
) => {
  const businessKey = buildShiftBusinessKey(id);

  enqueueOfflineRepositoryUpdate({
    table: 'rental_shifts',
    repository: 'rentalShifts',
    id,
    updates: { ...updates },
    payload: {
      ...(updates.label !== undefined ? { label: updates.label } : {}),
      ...(updates.priceUsd !== undefined
        ? { price_usd: updates.priceUsd }
        : {}),
      ...(updates.hours !== undefined ? { hours: updates.hours } : {}),
      ...(updates.hasDivisaDiscount !== undefined
        ? { has_divisa_discount: updates.hasDivisaDiscount }
        : {}),
      ...(updates.divisaDiscountAmount !== undefined
        ? { divisa_discount_amount: updates.divisaDiscountAmount }
        : {}),
      ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
    },
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineRentalShiftDelete = (
  id: string,
  actionSource = 'rentals/deleteShift'
) => {
  const businessKey = buildShiftBusinessKey(id);

  enqueueOfflineRepositoryDelete({
    table: 'rental_shifts',
    repository: 'rentalShifts',
    id,
    enqueueSource: actionSource,
    businessKey,
  });
};
