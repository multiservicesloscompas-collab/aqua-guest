import { appRepositories } from '@/lib/app-repositories';
import type { GlobalSyncAction } from './types';

export interface RepositoryMutationResult {
  error: unknown;
  insertedId?: string;
}

type RepositoryMap = {
  sales: typeof appRepositories.salesRepository;
  expenses: typeof appRepositories.expensesRepository;
  paymentBalance: typeof appRepositories.paymentBalanceRepository;
  exchangeRates: typeof appRepositories.exchangeRatesRepository;
  literPricing: typeof appRepositories.literPricingRepository;
  tips: typeof appRepositories.tipsRepository;
  customers: typeof appRepositories.customersRepository;
  washingMachines: typeof appRepositories.washingMachinesRepository;
  prepaidOrders: typeof appRepositories.prepaidOrdersRepository;
  rentalShifts: typeof appRepositories.rentalShiftsRepository;
  washerRentals: typeof appRepositories.washerRentalsRepository;
};

const repositories: RepositoryMap = {
  sales: appRepositories.salesRepository,
  expenses: appRepositories.expensesRepository,
  paymentBalance: appRepositories.paymentBalanceRepository,
  exchangeRates: appRepositories.exchangeRatesRepository,
  literPricing: appRepositories.literPricingRepository,
  tips: appRepositories.tipsRepository,
  customers: appRepositories.customersRepository,
  washingMachines: appRepositories.washingMachinesRepository,
  prepaidOrders: appRepositories.prepaidOrdersRepository,
  rentalShifts: appRepositories.rentalShiftsRepository,
  washerRentals: appRepositories.washerRentalsRepository,
};

const asEntityWithId = (value: unknown): { id?: string } => {
  return (value ?? {}) as { id?: string };
};

const getRepositoryPayload = (payload: Record<string, unknown>) => {
  const repository = payload.__repository;
  const operation = payload.__operation;
  const input = payload.__input;

  if (
    typeof repository !== 'string' ||
    typeof operation !== 'string' ||
    !input ||
    typeof input !== 'object'
  ) {
    return null;
  }

  return {
    repository,
    operation,
    input: input as Record<string, unknown>,
  };
};

const resolveRecord = (
  value: Record<string, unknown>,
  tempIdToRealId: Map<string, string>
): Record<string, unknown> => {
  const nextValue = { ...value };

  for (const key of Object.keys(nextValue)) {
    const current = nextValue[key];

    if (typeof current === 'string' && current.startsWith('temp-')) {
      nextValue[key] = tempIdToRealId.get(current) ?? current;
      continue;
    }

    if (Array.isArray(current)) {
      nextValue[key] = current.map((item) => {
        if (!item || typeof item !== 'object') {
          return item;
        }

        return resolveRecord(item as Record<string, unknown>, tempIdToRealId);
      });
      continue;
    }

    if (current && typeof current === 'object') {
      nextValue[key] = resolveRecord(
        current as Record<string, unknown>,
        tempIdToRealId
      );
    }
  }

  return nextValue;
};

export const dispatchRepositoryMutation = async (
  action: GlobalSyncAction,
  tempIdToRealId: Map<string, string>
): Promise<RepositoryMutationResult | null> => {
  const repositoryPayload = getRepositoryPayload(action.payload);
  if (!repositoryPayload) {
    return null;
  }

  const repository =
    repositories[repositoryPayload.repository as keyof typeof repositories];

  if (!repository) {
    return null;
  }

  const resolvedInput = resolveRecord(repositoryPayload.input, tempIdToRealId);

  if (repositoryPayload.operation === 'create') {
    const created = await repository.create(resolvedInput as never);
    return { error: null, insertedId: asEntityWithId(created).id };
  }

  if (repositoryPayload.operation === 'update') {
    const update = repository.update as (
      id: unknown,
      input: unknown
    ) => Promise<void>;
    await update(
      resolvedInput.id,
      (resolvedInput.updates as Record<string, unknown>) ?? {}
    );
    return { error: null };
  }

  if (repositoryPayload.operation === 'delete') {
    const remove = repository.delete as (id: unknown) => Promise<void>;
    await remove(resolvedInput.id);
    return { error: null };
  }

  if (
    repositoryPayload.operation === 'upsert' &&
    repositoryPayload.repository === 'exchangeRates'
  ) {
    await appRepositories.exchangeRatesRepository.upsert(
      resolvedInput as unknown as Parameters<
        typeof appRepositories.exchangeRatesRepository.upsert
      >[0]
    );
    return { error: null };
  }

  if (
    repositoryPayload.operation === 'deleteByOrigin' &&
    'deleteByOrigin' in repository
  ) {
    await (repository as typeof appRepositories.tipsRepository).deleteByOrigin(
      resolvedInput.originType as 'sale' | 'rental',
      String(resolvedInput.originId)
    );
    return { error: null };
  }

  if (
    repositoryPayload.operation === 'upsertByOrigin' &&
    'upsertByOrigin' in repository
  ) {
    const result = await (
      repository as typeof appRepositories.tipsRepository
    ).upsertByOrigin({
      originType: resolvedInput.originType as 'sale' | 'rental',
      originId: String(resolvedInput.originId),
      tipDate: String(resolvedInput.tipDate),
      amountBs: Number(resolvedInput.amountBs),
      amountUsd:
        resolvedInput.amountUsd === undefined
          ? undefined
          : Number(resolvedInput.amountUsd),
      exchangeRateUsed:
        resolvedInput.exchangeRateUsed === undefined
          ? undefined
          : Number(resolvedInput.exchangeRateUsed),
      capturePaymentMethod: resolvedInput.capturePaymentMethod as never,
      notes:
        typeof resolvedInput.notes === 'string'
          ? resolvedInput.notes
          : undefined,
    });
    return { error: null, insertedId: result.id };
  }

  if (repositoryPayload.operation === 'replace' && 'replace' in repository) {
    await (repository as typeof appRepositories.literPricingRepository).replace(
      resolvedInput.items as Parameters<
        typeof appRepositories.literPricingRepository.replace
      >[0]
    );
    return { error: null };
  }

  return null;
};
