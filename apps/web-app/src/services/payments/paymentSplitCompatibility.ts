import type { PaymentMethod, Sale, WasherRental } from '@/types';
import type { PaymentSplit, SplitAware } from '@/types/paymentSplits';

export function deriveLegacyPaymentMethodFromSplits(
  splits: readonly PaymentSplit[],
  fallback: PaymentMethod = 'efectivo'
): PaymentMethod {
  if (!splits.length) return fallback;

  const byAmount = [...splits].sort((a, b) => {
    if (b.amountBs !== a.amountBs) return b.amountBs - a.amountBs;
    return a.method.localeCompare(b.method);
  });

  return byAmount[0].method;
}

export function toPaymentSplitsFromLegacy(
  paymentMethod: PaymentMethod,
  amountBs: number,
  amountUsd?: number,
  exchangeRateUsed?: number
): PaymentSplit[] {
  return [
    {
      method: paymentMethod,
      amountBs,
      amountUsd,
      exchangeRateUsed,
    },
  ];
}

export function resolvePaymentSplitsForSale(
  sale: SplitAware<Sale>
): PaymentSplit[] {
  if (sale.paymentSplits?.length) return sale.paymentSplits;

  return toPaymentSplitsFromLegacy(
    sale.paymentMethod,
    sale.totalBs,
    sale.totalUsd,
    sale.exchangeRate
  );
}

export function resolvePaymentSplitsForRental(
  rental: SplitAware<WasherRental>,
  exchangeRate: number
): PaymentSplit[] {
  if (rental.paymentSplits?.length) return rental.paymentSplits;

  const fallbackAmountBs = rental.totalUsd * exchangeRate;
  return toPaymentSplitsFromLegacy(
    rental.paymentMethod,
    fallbackAmountBs,
    rental.totalUsd,
    exchangeRate
  );
}

export function withSplitCompatibilityForSale(
  sale: Sale,
  paymentSplits?: PaymentSplit[]
): SplitAware<Sale> {
  const resolvedSplits =
    paymentSplits && paymentSplits.length
      ? paymentSplits
      : toPaymentSplitsFromLegacy(
          sale.paymentMethod,
          sale.totalBs,
          sale.totalUsd,
          sale.exchangeRate
        );

  return {
    ...sale,
    paymentMethod: deriveLegacyPaymentMethodFromSplits(
      resolvedSplits,
      sale.paymentMethod
    ),
    paymentSplits: resolvedSplits,
  };
}

export function withSplitCompatibilityForRental(
  rental: WasherRental,
  paymentSplits: PaymentSplit[] | undefined,
  exchangeRate: number
): SplitAware<WasherRental> {
  const resolvedSplits =
    paymentSplits && paymentSplits.length
      ? paymentSplits
      : toPaymentSplitsFromLegacy(
          rental.paymentMethod,
          rental.totalUsd * exchangeRate,
          rental.totalUsd,
          exchangeRate
        );

  return {
    ...rental,
    paymentMethod: deriveLegacyPaymentMethodFromSplits(
      resolvedSplits,
      rental.paymentMethod
    ),
    paymentSplits: resolvedSplits,
  };
}
