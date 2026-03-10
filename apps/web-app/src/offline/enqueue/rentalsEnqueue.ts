import type { WasherRental } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import { rentalPaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import { useSyncStore } from '@/store/useSyncStore';

interface EnqueueOfflineRentalInput {
  payload: Record<string, unknown>;
  rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>;
  paymentSplits?: PaymentSplit[];
  actionSource?: string;
}

interface EnqueueOfflineRentalUpdateInput {
  id: string;
  payload: Record<string, unknown>;
  actionSource?: string;
}

interface EnqueueOfflineRentalDeleteInput {
  id: string;
  actionSource?: string;
}

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildRentalBusinessKey = (
  rental: Omit<WasherRental, 'id' | 'createdAt' | 'updatedAt'>
) =>
  `rental:${rental.date}:${rental.customerId ?? 'unknown'}:${
    rental.machineId
  }:${rental.deliveryTime}`;

export const enqueueOfflineRental = (
  input: EnqueueOfflineRentalInput
): WasherRental => {
  const tempId = generateTempId();
  const rentalBusinessKey = buildRentalBusinessKey(input.rental);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'washer_rentals',
    payload: { ...input.payload, tempId },
    enqueueSource: input.actionSource ?? 'rentals/addRental',
    businessKey: rentalBusinessKey,
  });

  if (input.paymentSplits?.length) {
    useSyncStore.getState().addToQueue({
      type: 'INSERT',
      table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
      payload: {
        splits: rentalPaymentSplitAdapter.toInsertRows(
          tempId,
          input.paymentSplits
        ),
        isSplit: true,
        parentId: tempId,
      },
      enqueueSource: input.actionSource ?? 'rentals/addRental',
      businessKey: `rental-splits:${tempId}`,
      dependencyKeys: [rentalBusinessKey],
    });
  }

  const now = new Date().toISOString();

  return {
    ...input.rental,
    id: tempId,
    paymentSplits: input.paymentSplits,
    createdAt: now,
    updatedAt: now,
  };
};

const buildRentalEntityBusinessKey = (id: string) => `rental:${id}`;

export const enqueueOfflineRentalUpdate = (
  input: EnqueueOfflineRentalUpdateInput
) => {
  const businessKey = buildRentalEntityBusinessKey(input.id);

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'washer_rentals',
    payload: {
      id: input.id,
      ...input.payload,
    },
    enqueueSource: input.actionSource ?? 'rentals/updateRental',
    businessKey,
    dependencyKeys: input.id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineRentalDelete = (
  input: EnqueueOfflineRentalDeleteInput
) => {
  const businessKey = buildRentalEntityBusinessKey(input.id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'washer_rentals',
    payload: { id: input.id },
    enqueueSource: input.actionSource ?? 'rentals/deleteRental',
    businessKey,
    dependencyKeys: input.id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflineRentalPaymentSplitsReplace = (
  rentalId: string,
  splits: PaymentSplit[],
  actionSource = 'rentals/updateRental'
) => {
  const businessKey = `rental-splits:${rentalId}`;

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
    payload: {
      id: `rental_id:${rentalId}`,
      parentId: rentalId,
      parentColumn: 'rental_id',
      __op: 'delete_by_parent_id',
    },
    enqueueSource: actionSource,
    businessKey,
  });

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
    payload: {
      splits: rentalPaymentSplitAdapter.toInsertRows(rentalId, splits),
      isSplit: true,
      parentId: rentalId,
    },
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineRentalPaymentSplitsDelete = (
  rentalId: string,
  actionSource = 'rentals/deleteRental'
) => {
  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
    payload: {
      id: `rental_id:${rentalId}`,
      parentId: rentalId,
      parentColumn: 'rental_id',
      __op: 'delete_by_parent_id',
    },
    enqueueSource: actionSource,
    businessKey: `rental-splits:${rentalId}`,
  });
};
