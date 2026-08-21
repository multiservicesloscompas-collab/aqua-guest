import type { PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import type {
  WasherRental,
  WasherRentalDraft,
} from '@aqua-guest/domain/modules/washer-rentals';
import { PAYMENT_SPLIT_SCHEMA } from '@/services/payments/paymentSplitSchemaContract';
import { rentalPaymentSplitAdapter } from '@/services/payments/paymentSplitSupabaseAdapters';
import {
  createOfflineTempId,
  enqueueOfflineOriginTipDelete,
  enqueueOfflineOriginTipUpsert,
  enqueueOfflineRepositoryCreate,
  enqueueOfflineRepositoryDelete,
  enqueueOfflineRepositoryMutation,
  enqueueOfflineRepositoryUpdate,
} from './enqueueEntityHelpers';

interface EnqueueOfflineRentalInput {
  payload: Record<string, unknown>;
  rental: WasherRentalDraft;
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

const buildRentalBusinessKey = (
  rental: WasherRentalDraft
) =>
  `rental:${rental.date}:${rental.customerId ?? 'unknown'}:${
    rental.machineId
  }:${rental.deliveryTime}`;

export const enqueueOfflineRental = (
  input: EnqueueOfflineRentalInput
): WasherRental => {
  const tempId = createOfflineTempId();
  const rentalBusinessKey = buildRentalBusinessKey(input.rental);
  const enqueueSource = input.actionSource ?? 'rentals/addRental';

  enqueueOfflineRepositoryCreate({
    table: 'washer_rentals',
    repository: 'washerRentals',
    input: {
      tempId,
      ...input.rental,
      paymentSplits: input.paymentSplits,
    },
    payload: { ...input.payload, tempId },
    enqueueSource,
    businessKey: rentalBusinessKey,
  });

  if (input.paymentSplits?.length) {
    enqueueOfflineRepositoryMutation({
      type: 'UPDATE',
      table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
      repository: 'washerRentals',
      operation: 'update',
      input: {
        id: tempId,
        updates: { paymentSplits: input.paymentSplits },
      },
      payload: { id: tempId },
      enqueueSource,
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

  enqueueOfflineRepositoryUpdate({
    table: 'washer_rentals',
    repository: 'washerRentals',
    id: input.id,
    updates: input.payload,
    payload: input.payload,
    enqueueSource: input.actionSource ?? 'rentals/updateRental',
    businessKey,
  });
};

export const enqueueOfflineRentalDelete = (
  input: EnqueueOfflineRentalDeleteInput
) => {
  const businessKey = buildRentalEntityBusinessKey(input.id);

  enqueueOfflineRepositoryDelete({
    table: 'washer_rentals',
    repository: 'washerRentals',
    id: input.id,
    enqueueSource: input.actionSource ?? 'rentals/deleteRental',
    businessKey,
  });
};

export const enqueueOfflineRentalPaymentSplitsReplace = (
  rentalId: string,
  splits: PaymentSplit[],
  actionSource = 'rentals/updateRental'
) => {
  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
    repository: 'washerRentals',
    operation: 'update',
    input: {
      id: rentalId,
      updates: { paymentSplits: splits },
    },
    payload: {
      id: rentalId,
      splits: rentalPaymentSplitAdapter.toInsertRows(rentalId, splits),
      __legacyRepositorySemantic: true,
    },
    enqueueSource: actionSource,
    businessKey: `rental-splits:${rentalId}`,
  });
};

export const enqueueOfflineRentalPaymentSplitsDelete = (
  rentalId: string,
  actionSource = 'rentals/deleteRental'
) => {
  enqueueOfflineRepositoryMutation({
    type: 'UPDATE',
    table: PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable,
    repository: 'washerRentals',
    operation: 'update',
    input: {
      id: rentalId,
      updates: { paymentSplits: [] },
    },
    payload: { id: rentalId, __legacyRepositorySemantic: true },
    enqueueSource: actionSource,
    businessKey: `rental-splits:${rentalId}`,
  });
};

export const enqueueOfflineRentalTipDelete = (
  rentalId: string,
  actionSource = 'rentals/deleteRental'
) => {
  enqueueOfflineOriginTipDelete({
    entityId: rentalId,
    originType: 'rental',
    enqueueSource: actionSource,
    businessKey: `tip-origin-rental:${rentalId}`,
  });
};

interface EnqueueOfflineRentalTipUpsertInput {
  rentalId: string;
  tipDate: string;
  amountBs: number;
  amountUsd?: number;
  exchangeRateUsed?: number;
  capturePaymentMethod: PaymentMethod;
  notes?: string;
  actionSource?: string;
}

export const enqueueOfflineRentalTipUpsert = (
  input: EnqueueOfflineRentalTipUpsertInput
) => {
  enqueueOfflineOriginTipUpsert({
    entityId: input.rentalId,
    originType: 'rental',
    tipDate: input.tipDate,
    amountBs: input.amountBs,
    amountUsd: input.amountUsd,
    exchangeRateUsed: input.exchangeRateUsed,
    capturePaymentMethod: input.capturePaymentMethod,
    notes: input.notes,
    enqueueSource: input.actionSource ?? 'rentals/updateRental',
    businessKey: `tip-origin-rental:${input.rentalId}`,
    tempDependencyBusinessKey: `rental:${input.rentalId}`,
  });
};
