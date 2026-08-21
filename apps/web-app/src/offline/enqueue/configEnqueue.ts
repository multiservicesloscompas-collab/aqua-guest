import type { ExchangeRateHistory, LiterPricing } from '@aqua-guest/domain';
import {
  enqueueOfflineRepositoryMutation,
} from './enqueueEntityHelpers';

interface EnqueueExchangeRateInput {
  date: string;
  rate: number;
  updatedAt: string;
}

interface EnqueueLiterPricingInput {
  pricing: LiterPricing[];
  previousPricing: LiterPricing[];
  actionSource?: string;
}

const buildExchangeRateBusinessKey = (date: string) => `exchange-rate:${date}`;

const buildLiterPricingBusinessKey = (breakpoint: number) =>
  `liter-pricing:${breakpoint}`;

export const enqueueOfflineExchangeRateUpsert = (
  input: EnqueueExchangeRateInput,
  actionSource = 'config/setExchangeRate'
) => {
  const businessKey = buildExchangeRateBusinessKey(input.date);

  enqueueOfflineRepositoryMutation({
    type: 'INSERT',
    table: 'exchange_rates',
    repository: 'exchangeRates',
    operation: 'upsert',
    input: {
      date: input.date,
      rate: input.rate,
      updatedAt: input.updatedAt,
    },
    payload: {
      date: input.date,
      rate: input.rate,
      updated_at: input.updatedAt,
    },
    enqueueSource: actionSource,
    businessKey,
  });
};

export const enqueueOfflineLiterPricingReplace = (
  input: EnqueueLiterPricingInput
) => {
  const actionSource = input.actionSource ?? 'config/setLiterPricing';
  const currentBreakpoints = new Set(
    input.pricing.map((item) => item.breakpoint)
  );

  for (const item of input.pricing) {
    const businessKey = buildLiterPricingBusinessKey(item.breakpoint);

    enqueueOfflineRepositoryMutation({
      type: 'INSERT',
      table: 'liter_pricing',
      repository: 'literPricing',
      operation: 'replace',
      input: {
        items: input.pricing,
      },
      payload: {
        breakpoint: item.breakpoint,
        price: item.price,
      },
      enqueueSource: actionSource,
      businessKey,
    });
  }

  for (const previous of input.previousPricing) {
    if (currentBreakpoints.has(previous.breakpoint)) {
      continue;
    }

    const syntheticId = `bp:${previous.breakpoint}`;
    const businessKey = buildLiterPricingBusinessKey(previous.breakpoint);

    enqueueOfflineRepositoryMutation({
      type: 'DELETE',
      table: 'liter_pricing',
      repository: 'literPricing',
      operation: 'delete',
      input: { id: previous.breakpoint },
      payload: { id: syntheticId, breakpoint: previous.breakpoint },
      enqueueSource: actionSource,
      businessKey,
    });
  }
};

export const applyOfflineExchangeRateHistory = (
  history: ExchangeRateHistory[],
  entry: ExchangeRateHistory
): ExchangeRateHistory[] => {
  const existingIndex = history.findIndex((h) => h.date === entry.date);
  if (existingIndex >= 0) {
    return history.map((h, index) => (index === existingIndex ? entry : h));
  }

  return [...history, entry];
};
