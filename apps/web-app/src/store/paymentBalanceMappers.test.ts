import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentBalanceTransaction } from '@/types';
import { mapPaymentBalanceTransactions } from './appStoreMappers';
import type { PaymentBalanceRow } from '@/services/payments/paymentBalanceSchemaContract';
import { rowToTransaction } from './usePaymentBalanceStore.core';

type RowMapper = (row: PaymentBalanceRow) => PaymentBalanceTransaction;

const mappers: [string, RowMapper][] = [
  [
    'mapPaymentBalanceTransactions',
    (row) => mapPaymentBalanceTransactions([row])[0],
  ],
  ['rowToTransaction', rowToTransaction],
];

const baseRow: PaymentBalanceRow = {
  id: 'row-1',
  date: '2026-03-09',
  from_method: 'pago_movil',
  to_method: 'efectivo',
  amount: 1000,
  created_at: '2026-03-09T10:00:00.000Z',
  updated_at: '2026-03-09T11:00:00.000Z',
};

describe.each(mappers)('%s', (_name, map) => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults the operation type to "equilibrio" when the row has none', () => {
    // Arrange
    const row = { ...baseRow, operation_type: null };

    // Act
    const result = map(row);

    // Assert
    expect(result.operationType).toBe('equilibrio');
  });

  it('keeps an explicit operation type', () => {
    // Arrange
    const row = { ...baseRow, operation_type: 'avance' as const };

    // Act
    const result = map(row);

    // Assert
    expect(result.operationType).toBe('avance');
  });

  it('converts numeric strings coming from the database to numbers', () => {
    // Arrange
    const row: PaymentBalanceRow = {
      ...baseRow,
      amount: '1000.50',
      amount_bs: '1000.50',
      amount_usd: '20.25',
    };

    // Act
    const result = map(row);

    // Assert
    expect(result.amount).toBe(1000.5);
    expect(result.amountBs).toBe(1000.5);
    expect(result.amountUsd).toBe(20.25);
  });

  it('falls back to the amount for missing Bs, out and in amounts', () => {
    // Arrange / Act
    const result = map(baseRow);

    // Assert
    expect(result.amountBs).toBe(1000);
    expect(result.amountOutBs).toBe(1000);
    expect(result.amountInBs).toBe(1000);
  });

  it('derives the Bs difference as in minus out when the row has none', () => {
    // Arrange
    const row = { ...baseRow, amount_out_bs: 1000, amount_in_bs: 980 };

    // Act
    const result = map(row);

    // Assert
    expect(result.differenceBs).toBe(-20);
  });

  it('uses the stored differences when present', () => {
    // Arrange
    const row = { ...baseRow, difference_bs: '-5', difference_usd: '-0.1' };

    // Act
    const result = map(row);

    // Assert
    expect(result.differenceBs).toBe(-5);
    expect(result.differenceUsd).toBe(-0.1);
  });

  it('leaves optional USD amounts undefined when the row has null', () => {
    // Arrange
    const row = {
      ...baseRow,
      amount_usd: null,
      amount_out_usd: null,
      amount_in_usd: null,
      difference_usd: null,
    };

    // Act
    const result = map(row);

    // Assert
    expect(result.amountUsd).toBeUndefined();
    expect(result.amountOutUsd).toBeUndefined();
    expect(result.amountInUsd).toBeUndefined();
    expect(result.differenceUsd).toBeUndefined();
  });

  it('keeps the note text', () => {
    // Arrange
    const row = { ...baseRow, notes: 'Ajuste de caja' };

    // Act
    const result = map(row);

    // Assert
    expect(result.notes).toBe('Ajuste de caja');
  });

  it('turns a null note into undefined', () => {
    // Arrange
    const row = { ...baseRow, notes: null };

    // Act
    const result = map(row);

    // Assert
    expect(result.notes).toBeUndefined();
  });

  it('preserves an empty note instead of dropping it', () => {
    // Arrange
    const row = { ...baseRow, notes: '' };

    // Act
    const result = map(row);

    // Assert
    expect(result.notes).toBe('');
  });

  it('keeps the stored timestamps', () => {
    // Arrange / Act
    const result = map(baseRow);

    // Assert
    expect(result.createdAt).toBe('2026-03-09T10:00:00.000Z');
    expect(result.updatedAt).toBe('2026-03-09T11:00:00.000Z');
  });

  it('uses the current time when the row has no timestamps', () => {
    // Arrange
    const row = { ...baseRow, created_at: null, updated_at: undefined };

    // Act
    const result = map(row);

    // Assert
    expect(result.createdAt).toBe('2026-04-01T12:00:00.000Z');
    expect(result.updatedAt).toBe('2026-04-01T12:00:00.000Z');
  });
});
