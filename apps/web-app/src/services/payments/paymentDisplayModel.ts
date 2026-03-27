import {
  PaymentMethodLabels,
  type PaymentMethod,
  type Sale,
  type WasherRental,
} from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import {
  getRentalAmountForMethodBs,
  getRentalAmountForMethodUsd,
  getSaleAmountForMethodBs,
  getSaleAmountForMethodUsd,
  includesMethodInRental,
  includesMethodInSale,
} from '@/services/payments/paymentSplitAttribution';
import { getPaymentMethods } from '@/services/payments/paymentSplitReadModel';
import { hasValidMixedPaymentSplits } from '@/services/payments/paymentSplitValidity';

export interface PaymentDisplayLine {
  method: PaymentMethod;
  label: string;
  amountBs: number;
  amountUsd: number;
}

export interface PaymentDisplayModel {
  kind: 'single' | 'mixed';
  label: string;
  primaryMethod: PaymentMethod;
  lines: PaymentDisplayLine[];
  totalBs: number;
  totalUsd: number;
}

type SplitAwareEntity = {
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
};

function fallbackAmountUsd(amountBs: number, exchangeRate: number): number {
  if (exchangeRate <= 0) {
    return 0;
  }
  return amountBs / exchangeRate;
}

function buildSinglePaymentModel(input: {
  paymentMethod: PaymentMethod;
  totalBs: number;
  totalUsd: number;
}): PaymentDisplayModel {
  const line: PaymentDisplayLine = {
    method: input.paymentMethod,
    label: PaymentMethodLabels[input.paymentMethod],
    amountBs: input.totalBs,
    amountUsd: input.totalUsd,
  };

  return {
    kind: 'single',
    label: PaymentMethodLabels[input.paymentMethod],
    primaryMethod: input.paymentMethod,
    lines: [line],
    totalBs: input.totalBs,
    totalUsd: input.totalUsd,
  };
}

function resolveMixedLines(input: {
  isIncluded: (method: PaymentMethod) => boolean;
  getAmountBs: (method: PaymentMethod) => number;
  getAmountUsd: (method: PaymentMethod) => number;
}): PaymentDisplayLine[] {
  return getPaymentMethods()
    .filter((method) => input.isIncluded(method))
    .map((method) => {
      const amountBs = input.getAmountBs(method);
      return {
        method,
        label: PaymentMethodLabels[method],
        amountBs,
        amountUsd: input.getAmountUsd(method),
      };
    })
    .filter((line) => line.amountBs > 0)
    .sort((a, b) => b.amountBs - a.amountBs);
}

function buildMixedPaymentModel(
  lines: PaymentDisplayLine[],
  fallback: {
    paymentMethod: PaymentMethod;
    totalBs: number;
    totalUsd: number;
  }
): PaymentDisplayModel {
  if (lines.length < 2) {
    return buildSinglePaymentModel(fallback);
  }

  const totalBs = lines.reduce((sum, line) => sum + line.amountBs, 0);
  const totalUsd = lines.reduce((sum, line) => sum + line.amountUsd, 0);

  return {
    kind: 'mixed',
    label: 'Pago mixto',
    primaryMethod: lines[0]?.method ?? fallback.paymentMethod,
    lines,
    totalBs,
    totalUsd,
  };
}

function resolveSaleExchangeRate(sale: Sale): number {
  if (sale.exchangeRate > 0) {
    return sale.exchangeRate;
  }
  if (sale.totalUsd > 0) {
    return sale.totalBs / sale.totalUsd;
  }
  return 0;
}

export function buildSalePaymentDisplayModel(sale: Sale): PaymentDisplayModel {
  if (!hasValidMixedPaymentSplits(sale.paymentSplits)) {
    return buildSinglePaymentModel({
      paymentMethod: sale.paymentMethod,
      totalBs: Number(sale.totalBs || 0),
      totalUsd: Number(sale.totalUsd || 0),
    });
  }

  const exchangeRate = resolveSaleExchangeRate(sale);
  const lines = resolveMixedLines({
    isIncluded: (method) => includesMethodInSale(sale, method),
    getAmountBs: (method) => getSaleAmountForMethodBs(sale, method),
    getAmountUsd: (method) => {
      const amountUsd = getSaleAmountForMethodUsd(sale, method, exchangeRate);
      const amountBs = getSaleAmountForMethodBs(sale, method);
      return amountUsd > 0
        ? amountUsd
        : fallbackAmountUsd(amountBs, exchangeRate);
    },
  });

  return buildMixedPaymentModel(lines, {
    paymentMethod: sale.paymentMethod,
    totalBs: Number(sale.totalBs || 0),
    totalUsd: Number(sale.totalUsd || 0),
  });
}

export function buildRentalPaymentDisplayModel(
  rental: WasherRental,
  exchangeRate: number
): PaymentDisplayModel {
  if (!hasValidMixedPaymentSplits(rental.paymentSplits)) {
    const totalBs = Number(rental.totalUsd || 0) * exchangeRate;
    return buildSinglePaymentModel({
      paymentMethod: rental.paymentMethod,
      totalBs,
      totalUsd: Number(rental.totalUsd || 0),
    });
  }

  const lines = resolveMixedLines({
    isIncluded: (method) => includesMethodInRental(rental, method),
    getAmountBs: (method) =>
      getRentalAmountForMethodBs(rental, method, exchangeRate),
    getAmountUsd: (method) => {
      const amountUsd = getRentalAmountForMethodUsd(
        rental,
        method,
        exchangeRate
      );
      const amountBs = getRentalAmountForMethodBs(rental, method, exchangeRate);
      return amountUsd > 0
        ? amountUsd
        : fallbackAmountUsd(amountBs, exchangeRate);
    },
  });

  return buildMixedPaymentModel(lines, {
    paymentMethod: rental.paymentMethod,
    totalBs: Number(rental.totalUsd || 0) * exchangeRate,
    totalUsd: Number(rental.totalUsd || 0),
  });
}

export function isMixedPaymentEntity(entity: SplitAwareEntity): boolean {
  return hasValidMixedPaymentSplits(entity.paymentSplits);
}
