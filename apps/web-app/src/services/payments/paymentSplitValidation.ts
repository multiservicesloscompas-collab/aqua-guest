import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import {
  reconcileSplitAmountsBs,
  reconcileSplitAmountsUsd,
  roundToCurrency,
} from './paymentSplitRounding';

const PAYMENT_METHODS: PaymentMethod[] = [
  'efectivo',
  'pago_movil',
  'punto_venta',
  'divisa',
];

const TOLERANCE = 0.01;

export interface PaymentSplitValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ValidatePaymentSplitsInput {
  splits: readonly PaymentSplit[];
  totalBs: number;
  totalUsd?: number;
  allowedMethods?: readonly PaymentMethod[];
  allowEmpty?: boolean;
}

export function validatePaymentSplits(
  input: ValidatePaymentSplitsInput
): PaymentSplitValidationResult {
  const {
    splits,
    totalBs,
    totalUsd,
    allowedMethods = PAYMENT_METHODS,
    allowEmpty = false,
  } = input;

  const errors: string[] = [];

  if (!splits.length && !allowEmpty) {
    errors.push('Debe registrar al menos un método de pago.');
  }

  for (const split of splits) {
    if (!allowedMethods.includes(split.method)) {
      errors.push(`Método de pago inválido: ${split.method}`);
    }

    if (split.amountBs < 0) {
      errors.push(`Monto Bs negativo para ${split.method}.`);
    }

    if (split.amountUsd !== undefined && split.amountUsd < 0) {
      errors.push(`Monto USD negativo para ${split.method}.`);
    }
  }

  const sumBs = roundToCurrency(
    splits.reduce((sum, split) => sum + split.amountBs, 0)
  );
  const expectedBs = roundToCurrency(totalBs);
  if (Math.abs(sumBs - expectedBs) > TOLERANCE) {
    errors.push(
      `La suma de métodos en Bs (${sumBs.toFixed(
        2
      )}) no coincide con el total (${expectedBs.toFixed(2)}).`
    );
  }

  if (totalUsd !== undefined) {
    const sumUsd = roundToCurrency(
      splits.reduce((sum, split) => sum + (split.amountUsd ?? 0), 0)
    );
    const expectedUsd = roundToCurrency(totalUsd);
    if (Math.abs(sumUsd - expectedUsd) > TOLERANCE) {
      errors.push(
        `La suma de métodos en USD (${sumUsd.toFixed(
          2
        )}) no coincide con el total (${expectedUsd.toFixed(2)}).`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function normalizeAndValidatePaymentSplits(
  input: ValidatePaymentSplitsInput
): { splits: PaymentSplit[]; validation: PaymentSplitValidationResult } {
  const roundedBs = reconcileSplitAmountsBs(input.totalBs, input.splits);

  const rounded =
    input.totalUsd === undefined
      ? roundedBs
      : reconcileSplitAmountsUsd(input.totalUsd, roundedBs);

  return {
    splits: rounded,
    validation: validatePaymentSplits({ ...input, splits: rounded }),
  };
}
