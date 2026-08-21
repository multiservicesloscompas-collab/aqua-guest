import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import type { WasherRentalUpdate } from '@aqua-guest/domain/modules/washer-rentals';
import {
  buildEditRentalUpdates,
  getEditRentalValidationError,
  notifyEditRentalValidationError,
  submitEditRental,
} from './editRentalSheetViewModel.submit';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/DateService', () => ({
  getVenezuelaDate: () => '2026-03-15',
}));

describe('editRentalSheetViewModel.submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEditRentalValidationError', () => {
    it('returns error when machineId is empty', () => {
      const error = getEditRentalValidationError({
        machineId: '',
        customerName: 'Juan Perez',
        customerAddress: 'Calle 1',
        unavailableMachines: [],
      });
      expect(error).toBe('Selecciona una lavadora');
    });

    it('returns error when customerName is blank', () => {
      const error = getEditRentalValidationError({
        machineId: 'machine-1',
        customerName: '   ',
        customerAddress: 'Calle 1',
        unavailableMachines: [],
      });
      expect(error).toBe('Completa nombre y dirección del cliente');
    });

    it('returns error when customerAddress is blank', () => {
      const error = getEditRentalValidationError({
        machineId: 'machine-1',
        customerName: 'Juan',
        customerAddress: '   ',
        unavailableMachines: [],
      });
      expect(error).toBe('Completa nombre y dirección del cliente');
    });

    it('returns error when machine is unavailable', () => {
      const error = getEditRentalValidationError({
        machineId: 'machine-1',
        customerName: 'Juan',
        customerAddress: 'Calle 1',
        unavailableMachines: ['machine-1'],
      });
      expect(error).toBe('Esta lavadora no está disponible');
    });

    it('returns null when valid', () => {
      const error = getEditRentalValidationError({
        machineId: 'machine-1',
        customerName: 'Juan',
        customerAddress: 'Calle 1',
        unavailableMachines: ['machine-2'],
      });
      expect(error).toBeNull();
    });
  });

  describe('notifyEditRentalValidationError', () => {
    it('emits toast error', () => {
      notifyEditRentalValidationError('Error de validación');
      expect(toast.error).toHaveBeenCalledWith('Error de validación');
    });
  });

  describe('buildEditRentalUpdates', () => {
    it('builds updates correctly with trimmed fields and isPaid true', () => {
      const updates = buildEditRentalUpdates({
        machineId: 'm-1',
        shift: 'completo',
        deliveryTime: '09:00',
        pickupTime: '09:00',
        pickupDate: '2026-03-16',
        deliveryFee: 1,
        totalUsd: 7,
        paymentMethod: 'efectivo',
        paymentSplits: [],
        selectedCustomerId: 'cust-1',
        customerName: '  Maria Lopez  ',
        customerPhone: ' 04141234567 ',
        customerAddress: '  Av Principal  ',
        notes: '  dejar en conserjeria  ',
        status: 'agendado',
        isPaid: true,
        datePaid: '2026-03-15',
      });

      expect(updates).toEqual<WasherRentalUpdate>({
        machineId: 'm-1',
        shift: 'completo',
        deliveryTime: '09:00',
        pickupTime: '09:00',
        pickupDate: '2026-03-16',
        deliveryFee: 1,
        totalUsd: 7,
        paymentMethod: 'efectivo',
        paymentSplits: [],
        customerId: 'cust-1',
        customerName: 'Maria Lopez',
        customerPhone: '04141234567',
        customerAddress: 'Av Principal',
        notes: 'dejar en conserjeria',
        status: 'agendado',
        isPaid: true,
        datePaid: '2026-03-15',
      });
    });

    it('sets datePaid to null when isPaid is false', () => {
      const updates = buildEditRentalUpdates({
        machineId: 'm-1',
        shift: 'medio',
        deliveryTime: '09:00',
        pickupTime: '13:00',
        pickupDate: '2026-03-15',
        deliveryFee: 0,
        totalUsd: 4,
        paymentMethod: 'pago_movil',
        paymentSplits: [],
        selectedCustomerId: '',
        customerName: 'Pedro',
        customerPhone: '',
        customerAddress: 'Calle 2',
        notes: '',
        status: 'agendado',
        isPaid: false,
        datePaid: '2026-03-15',
      });

      expect(updates.isPaid).toBe(false);
      expect(updates.datePaid).toBeNull();
      expect(updates.customerId).toBeUndefined();
      expect(updates.notes).toBeUndefined();
    });
  });

  describe('submitEditRental', () => {
    it('executes updateRental, notifies success and invokes onSuccess', async () => {
      const updateRentalMock = vi.fn().mockResolvedValue(undefined);
      const onSuccessMock = vi.fn();

      await submitEditRental({
        rentalId: 'rental-100',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        updates: {
          machineId: 'm-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-15',
          deliveryFee: 0,
          totalUsd: 2,
          paymentMethod: 'efectivo',
          paymentSplits: [],
          selectedCustomerId: 'c-1',
          customerName: 'Ana',
          customerPhone: '0412',
          customerAddress: 'Urb Centro',
          notes: '',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-15',
        },
        tipInput: null,
        updateRental: updateRentalMock,
        onSuccess: onSuccessMock,
      });

      expect(updateRentalMock).toHaveBeenCalledTimes(1);
      expect(updateRentalMock).toHaveBeenCalledWith(
        'rental-100',
        expect.objectContaining({
          machineId: 'm-1',
          customerName: 'Ana',
          isPaid: true,
          datePaid: '2026-03-15',
        }),
        null
      );
      expect(toast.success).toHaveBeenCalledWith('Alquiler actualizado');
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});
