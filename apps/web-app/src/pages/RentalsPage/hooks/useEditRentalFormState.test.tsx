/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WasherRental } from '@/types';
import { useEditRentalFormState } from './useEditRentalFormState';

const buildRental = (id: string, notes: string): WasherRental => ({
  id,
  date: '2026-03-15',
  customerId: 'customer-1',
  customerName: 'Cliente',
  customerPhone: '0414',
  customerAddress: 'Centro',
  machineId: 'machine-1',
  shift: 'medio',
  deliveryTime: '09:00',
  pickupTime: '17:00',
  pickupDate: '2026-03-15',
  deliveryFee: 0,
  totalUsd: 4,
  paymentMethod: 'efectivo',
  paymentSplits: [
    { method: 'efectivo', amountBs: 160, amountUsd: 4, exchangeRateUsed: 40 },
  ],
  status: 'agendado',
  isPaid: true,
  datePaid: '2026-03-15',
  notes,
  createdAt: '2026-03-15T08:00:00.000Z',
  updatedAt: '2026-03-15T08:00:00.000Z',
});

describe('useEditRentalFormState hydration (B2)', () => {
  it('loads the form from the rental', () => {
    // Act
    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental: buildRental('rental-1', 'nota guardada'),
        exchangeRate: 40,
      })
    );

    // Assert
    expect(result.current.notes).toBe('nota guardada');
    expect(result.current.machineId).toBe('machine-1');
  });

  it('keeps what the user typed when the exchange rate arrives later', () => {
    // Arrange
    const rental = buildRental('rental-1', 'nota guardada');
    const { result, rerender } = renderHook(
      (props: { exchangeRate: number }) =>
        useEditRentalFormState({ rental, exchangeRate: props.exchangeRate }),
      { initialProps: { exchangeRate: 40 } }
    );
    act(() => result.current.setNotes('nota escrita por el usuario'));

    // Act: the delayed exchange rate finally arrives
    rerender({ exchangeRate: 50 });

    // Assert
    expect(result.current.notes).toBe('nota escrita por el usuario');
  });

  it('loads the new rental when the sheet switches to another one', () => {
    const { result, rerender } = renderHook(
      (props: { rental: WasherRental }) =>
        useEditRentalFormState({ rental: props.rental, exchangeRate: 40 }),
      { initialProps: { rental: buildRental('rental-1', 'nota uno') } }
    );
    act(() => result.current.setNotes('escrita'));

    rerender({ rental: buildRental('rental-2', 'nota dos') });

    expect(result.current.notes).toBe('nota dos');
  });
});
