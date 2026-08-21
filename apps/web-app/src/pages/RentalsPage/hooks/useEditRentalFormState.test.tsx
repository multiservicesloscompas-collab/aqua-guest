import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WasherRental } from '@/types';
import { useEditRentalFormState } from './useEditRentalFormState';

function buildRental(overrides?: Partial<WasherRental>): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-15',
    customerId: 'cust-1',
    customerName: 'Carlos Ruiz',
    customerPhone: '04121234567',
    customerAddress: 'Sector La Paz',
    machineId: 'machine-10',
    shift: 'completo',
    deliveryTime: '09:00',
    pickupTime: '09:00',
    pickupDate: '2026-03-16',
    deliveryFee: 1,
    totalUsd: 7,
    paymentMethod: 'efectivo',
    status: 'agendado',
    isPaid: false,
    notes: 'Entregar antes de mediodia',
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('useEditRentalFormState', () => {
  it('initializes state lazily from rental data', () => {
    const rental = buildRental({
      paymentSplits: [
        {
          method: 'pago_movil',
          amountBs: 200,
          amountUsd: 4,
          exchangeRateUsed: 50,
        },
        {
          method: 'efectivo',
          amountBs: 150,
          amountUsd: 3,
          exchangeRateUsed: 50,
        },
      ],
    });

    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental,
        exchangeRate: 50,
      })
    );

    expect(result.current.machineId).toBe('machine-10');
    expect(result.current.shift).toBe('completo');
    expect(result.current.deliveryTime).toBe('09:00');
    expect(result.current.deliveryFee).toBe(1);
    expect(result.current.customerName).toBe('Carlos Ruiz');
    expect(result.current.customerPhone).toBe('04121234567');
    expect(result.current.customerAddress).toBe('Sector La Paz');
    expect(result.current.selectedCustomerId).toBe('cust-1');
    expect(result.current.notes).toBe('Entregar antes de mediodia');
    expect(result.current.status).toBe('agendado');
    expect(result.current.isPaid).toBe(false);
    expect(result.current.isMixedPayment).toBe(true);
    expect(result.current.paymentMethod).toBe('pago_movil');
    expect(result.current.split2Method).toBe('efectivo');
    expect(result.current.split1Amount).toBe('150');
  });

  it('updates customer fields via selectCustomer and clearCustomer', () => {
    const rental = buildRental();
    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental,
        exchangeRate: 50,
      })
    );

    act(() => {
      result.current.selectCustomer({
        id: 'cust-2',
        name: 'Elena Blanco',
        phone: '04149876543',
        address: 'Calle Nueva #4',
      });
    });

    expect(result.current.selectedCustomerId).toBe('cust-2');
    expect(result.current.customerName).toBe('Elena Blanco');
    expect(result.current.customerPhone).toBe('04149876543');
    expect(result.current.customerAddress).toBe('Calle Nueva #4');

    act(() => {
      result.current.clearCustomer();
    });

    expect(result.current.selectedCustomerId).toBe('');
    expect(result.current.customerName).toBe('');
    expect(result.current.customerPhone).toBe('');
    expect(result.current.customerAddress).toBe('');
  });

  it('adjusts secondary payment method atomically when primary method collides', () => {
    const rental = buildRental({
      paymentMethod: 'pago_movil',
    });

    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental,
        exchangeRate: 50,
      })
    );

    // Initial: paymentMethod = 'pago_movil', split2Method = 'efectivo'
    expect(result.current.paymentMethod).toBe('pago_movil');
    expect(result.current.split2Method).toBe('efectivo');

    // Selecting primary as 'efectivo' should immediately switch secondary to 'pago_movil'
    act(() => {
      result.current.selectPrimaryPaymentMethod('efectivo');
    });

    expect(result.current.paymentMethod).toBe('efectivo');
    expect(result.current.split2Method).toBe('pago_movil');
  });

  it('clears split1Amount when toggling mixed payment off', () => {
    const rental = buildRental();
    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental,
        exchangeRate: 50,
      })
    );

    act(() => {
      result.current.setSplit1Amount('120');
      result.current.toggleMixedPayment(); // turns ON
    });

    expect(result.current.isMixedPayment).toBe(true);
    expect(result.current.split1Amount).toBe('120');

    act(() => {
      result.current.toggleMixedPayment(); // turns OFF
    });

    expect(result.current.isMixedPayment).toBe(false);
    expect(result.current.split1Amount).toBe('');
  });

  it('updates payment status and sets default datePaid when marking as paid', () => {
    const rental = buildRental({
      isPaid: false,
      datePaid: undefined,
    });

    const { result } = renderHook(() =>
      useEditRentalFormState({
        rental,
        exchangeRate: 50,
      })
    );

    act(() => {
      result.current.changePaymentStatus('paid', '2026-03-15');
    });

    expect(result.current.isPaid).toBe(true);
    expect(result.current.datePaid).toBe('2026-03-15');

    act(() => {
      result.current.changePaymentStatus('pending', '2026-03-15');
    });

    expect(result.current.isPaid).toBe(false);
  });

  it('does NOT overwrite user edits when exchangeRate changes in background', () => {
    const rental = buildRental();
    const { result, rerender } = renderHook(
      ({ rate }) =>
        useEditRentalFormState({
          rental,
          exchangeRate: rate,
        }),
      {
        initialProps: { rate: 50 },
      }
    );

    act(() => {
      result.current.setCustomerName('Nombre Modificado');
      result.current.setNotes('Nota modificada');
    });

    expect(result.current.customerName).toBe('Nombre Modificado');
    expect(result.current.notes).toBe('Nota modificada');

    // Background rate update
    rerender({ rate: 55 });

    expect(result.current.customerName).toBe('Nombre Modificado');
    expect(result.current.notes).toBe('Nota modificada');
  });
});
