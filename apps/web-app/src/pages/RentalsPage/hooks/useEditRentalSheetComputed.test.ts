import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  LEGACY_SHIFT_DEFINITIONS,
  PAYMENT_METHOD,
  RENTAL_SHIFT,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import type { WasherRental } from '@/types';
import { useEditRentalSheetComputed } from './useEditRentalSheetComputed';

const SNAPSHOT: RentalShiftDefinition = {
  id: RENTAL_SHIFT.doble,
  label: 'Doble Especial',
  priceUsd: 10,
  hours: 8,
  divisaDiscountUsd: 0,
};

const RENTAL: WasherRental = {
  id: 'rental-1',
  date: '2026-05-11',
  customerId: 'customer-1',
  customerName: 'Cliente',
  customerPhone: '0414',
  customerAddress: 'Centro',
  machineId: 'machine-1',
  shift: RENTAL_SHIFT.doble,
  shiftSnapshot: SNAPSHOT,
  deliveryTime: '09:00',
  pickupTime: '17:00',
  pickupDate: '2026-05-11',
  deliveryFee: 1,
  totalUsd: 11,
  paymentMethod: PAYMENT_METHOD.efectivo,
  status: 'agendado',
  isPaid: true,
  createdAt: '2026-05-11T08:00:00.000Z',
  updatedAt: '2026-05-11T08:00:00.000Z',
};

function compute(
  shift: WasherRental['shift'],
  shiftCatalog: RentalShiftDefinition[] = []
) {
  return renderHook(() =>
    useEditRentalSheetComputed({
      rental: RENTAL,
      shift,
      shiftCatalog,
      paymentMethod: PAYMENT_METHOD.efectivo,
      deliveryFee: 1,
      deliveryTime: '09:00',
      split2Method: PAYMENT_METHOD.pago_movil,
      split1Amount: '',
      hasMixedPaymentEnabled: false,
      tipAmountBs: 0,
      exchangeRate: 50,
      rentals: [],
    })
  ).result.current;
}

describe('useEditRentalSheetComputed', () => {
  it('keeps the price and duration of the rental while its shift is unchanged', () => {
    // Arrange / Act
    const computed = compute(RENTAL_SHIFT.doble);

    // Assert
    expect(computed.subtotalUsd).toBe(11);
    expect(computed.totalUsd).toBe(11);
    expect(computed.pickupInfo).toEqual({
      pickupTime: '17:00',
      pickupDate: '2026-05-11',
    });
  });

  it('prices and schedules with the current definition after picking another shift', () => {
    // Arrange
    const medio = LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.medio];

    // Act
    const computed = compute(RENTAL_SHIFT.medio);

    // Assert
    expect(computed.subtotalUsd).toBe(medio.priceUsd + 1);
    expect(computed.pickupInfo).toEqual({
      pickupTime: '17:00',
      pickupDate: '2026-05-11',
    });
  });

  it('prices and schedules a custom catalog shift picked while editing', () => {
    // Arrange
    const nocturno: RentalShiftDefinition = {
      id: 'uuid-nocturno',
      label: 'Nocturno',
      priceUsd: 5,
      hours: 4,
      divisaDiscountUsd: 0,
    };

    // Act
    const computed = compute(nocturno.id, [nocturno]);

    // Assert
    expect(computed.subtotalUsd).toBe(6);
    expect(computed.pickupInfo).toEqual({
      pickupTime: '13:00',
      pickupDate: '2026-05-11',
    });
  });
});
