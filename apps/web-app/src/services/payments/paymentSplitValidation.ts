import type {
  PaymentMethod,
  PaymentSplit,
  PaymentSplitKind,
} from '@aqua-guest/domain';
import { resolveSplitKind } from '@aqua-guest/domain';
import {
  reconcileSplitAmountsBs,
  reconcileSplitAmountsUsd,
  roundToCurrency,
  type ResidualTargetSelector,
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

const DEFAULT_ALLOWED_KINDS: readonly PaymentSplitKind[] = [
  'payment',
  'change',
];

export interface ValidatePaymentSplitsInput {
  splits: readonly PaymentSplit[];
  totalBs: number;
  totalUsd?: number;
  allowedMethods?: readonly PaymentMethod[];
  allowEmpty?: boolean;
  /**
   * Which split kinds are acceptable. Defaults to both. Expenses call sites
   * pass `['payment']` so a change row can never reach that table, even if
   * one were ever constructed upstream by mistake.
   */
  allowedKinds?: readonly PaymentSplitKind[];
  /**
   * Which split absorbs a rounding residual during normalization. Only the
   * divisa-change write path passes one (`preferNonDivisaChangeLeg`);
   * every other caller keeps the default largest-value target.
   */
  residualTarget?: ResidualTargetSelector;
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
    allowedKinds = DEFAULT_ALLOWED_KINDS,
  } = input;

  const errors: string[] = [];

  if (!splits.length && !allowEmpty) {
    errors.push('Debe registrar al menos un método de pago.');
  }

  for (const split of splits) {
    if (!allowedMethods.includes(split.method)) {
      errors.push(`Método de pago inválido: ${split.method}`);
    }

    const kind = resolveSplitKind(split);

    if (!allowedKinds.includes(kind)) {
      errors.push(`No se permite un split de vuelto para ${split.method}.`);
      continue;
    }

    if (kind === 'payment') {
      if (split.amountBs < 0) {
        errors.push(`Monto Bs negativo para ${split.method}.`);
      }
      if (split.amountUsd !== undefined && split.amountUsd < 0) {
        errors.push(`Monto USD negativo para ${split.method}.`);
      }
    } else {
      if (split.amountBs > 0) {
        errors.push(
          `Monto de vuelto debe ser negativo o cero para ${split.method}.`
        );
      }
      if (split.amountUsd !== undefined && split.amountUsd > 0) {
        errors.push(
          `Monto de vuelto en USD debe ser negativo o cero para ${split.method}.`
        );
      }
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
  const roundedBs = reconcileSplitAmountsBs(
    input.totalBs,
    input.splits,
    input.residualTarget
  );

  const rounded =
    input.totalUsd === undefined
      ? roundedBs
      : reconcileSplitAmountsUsd(
          input.totalUsd,
          roundedBs,
          input.residualTarget
        );

  return {
    splits: rounded,
    validation: validatePaymentSplits({ ...input, splits: rounded }),
  };
}
