import type { PaymentBalanceTransaction } from '@/types';
import type {
  PaymentBalanceFormData,
  PaymentBalanceOperationType,
} from './usePaymentBalancePageViewModel';

type ValidatedPayload = {
  operationType: PaymentBalanceOperationType;
  amount: number;
  amountBs: number;
  amountUsd?: number;
  amountOutBs: number;
  amountOutUsd?: number;
  amountInBs: number;
  amountInUsd?: number;
  differenceBs: number;
  differenceUsd?: number;
};

const toFiniteNumber = (value: number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const getLegacyAmountBs = (
  transaction: PaymentBalanceTransaction,
  exchangeRate: number
): number => {
  const amountBs = toFiniteNumber(transaction.amountBs);
  if (amountBs !== undefined) return amountBs;

  const amountUsd = toFiniteNumber(transaction.amountUsd);
  if (amountUsd !== undefined) return amountUsd * exchangeRate;

  return Number(transaction.amount);
};

export const validatePaymentBalanceForm = (
  formData: PaymentBalanceFormData,
  exchangeRate: number
): { payload: ValidatedPayload | null; error: string | null } => {
  if (!formData.fromMethod || !formData.toMethod || !formData.amountOut) {
    return {
      payload: null,
      error: 'Completa todos los campos requeridos',
    };
  }

  if (formData.operationType === 'avance' && !formData.amountIn) {
    return {
      payload: null,
      error: 'Completa el monto de entrada para registrar el avance',
    };
  }

  if (formData.fromMethod === formData.toMethod) {
    return {
      payload: null,
      error: 'Los métodos de pago origen y destino deben ser diferentes',
    };
  }

  const amountOutInput = parseFloat(formData.amountOut);
  if (isNaN(amountOutInput) || amountOutInput <= 0) {
    return {
      payload: null,
      error: 'El monto de salida debe ser un número positivo',
    };
  }

  const amountInInput =
    formData.operationType === 'avance'
      ? parseFloat(formData.amountIn)
      : amountOutInput;
  if (isNaN(amountInInput) || amountInInput <= 0) {
    return {
      payload: null,
      error: 'El monto de entrada debe ser un número positivo',
    };
  }

  const amountOutBs =
    formData.fromMethod === 'divisa'
      ? amountOutInput * exchangeRate
      : amountOutInput;
  const amountInBs =
    formData.toMethod === 'divisa'
      ? amountInInput * exchangeRate
      : amountInInput;
  const amountOutUsd =
    formData.fromMethod === 'divisa' ? amountOutInput : undefined;
  const amountInUsd =
    formData.toMethod === 'divisa' ? amountInInput : undefined;
  const differenceBs = amountInBs - amountOutBs;
  const differenceUsd =
    amountOutUsd !== undefined && amountInUsd !== undefined
      ? amountInUsd - amountOutUsd
      : undefined;

  return {
    payload: {
      operationType: formData.operationType,
      amount: amountOutBs,
      amountBs: amountOutBs,
      amountUsd: amountOutUsd ?? amountInUsd,
      amountOutBs,
      amountOutUsd,
      amountInBs,
      amountInUsd,
      differenceBs,
      differenceUsd,
    },
    error: null,
  };
};

export const mapTransactionToFormData = (
  transaction: PaymentBalanceTransaction,
  exchangeRate: number
): PaymentBalanceFormData => {
  const fallbackLegacyBs = getLegacyAmountBs(transaction, exchangeRate);
  const amountOutBs = transaction.amountOutBs ?? fallbackLegacyBs;
  const amountInBs = transaction.amountInBs ?? fallbackLegacyBs;

  const amountOutDisplay =
    transaction.fromMethod === 'divisa'
      ? transaction.amountOutUsd ??
        transaction.amountUsd ??
        amountOutBs / exchangeRate
      : amountOutBs;
  const amountInDisplay =
    transaction.toMethod === 'divisa'
      ? transaction.amountInUsd ??
        transaction.amountUsd ??
        amountInBs / exchangeRate
      : amountInBs;

  const operationType: PaymentBalanceOperationType =
    transaction.operationType ??
    (Math.abs(amountInBs - amountOutBs) > 0.000001 ? 'avance' : 'equilibrio');

  return {
    operationType,
    fromMethod: transaction.fromMethod,
    toMethod: transaction.toMethod,
    amountOut: amountOutDisplay.toString(),
    amountIn:
      operationType === 'avance'
        ? amountInDisplay.toString()
        : amountOutDisplay.toString(),
    notes: transaction.notes || '',
  };
};
