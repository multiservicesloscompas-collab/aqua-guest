import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RentalShiftConfig } from '@aqua-guest/domain';
import { toast } from 'sonner';
import { useConfiguracionTurnosViewModel } from './useConfiguracionTurnosViewModel';

const mockLoadShifts = vi.fn();
const mockAddShift = vi.fn();
const mockUpdateShift = vi.fn();
const mockDeleteShift = vi.fn();

let mockShifts: RentalShiftConfig[] = [];
const mockLoadingShifts = false;

vi.mock('@/store/useRentalStore', () => ({
  useRentalStore: () => ({
    shifts: mockShifts,
    loadingShifts: mockLoadingShifts,
    loadShifts: mockLoadShifts,
    addShift: mockAddShift,
    updateShift: mockUpdateShift,
    deleteShift: mockDeleteShift,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useConfiguracionTurnosViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadShifts.mockResolvedValue(undefined);
    mockAddShift.mockResolvedValue({ id: 'new-id' });
    mockUpdateShift.mockResolvedValue(undefined);
    mockDeleteShift.mockResolvedValue(undefined);

    mockShifts = [
      {
        id: 'shift-1',
        label: 'Turno Tarde',
        hours: 6,
        priceUsd: 15,
        hasDivisaDiscount: false,
        divisaDiscountAmount: 0,
        isActive: false,
      },
      {
        id: 'shift-2',
        label: 'Turno Mañana',
        hours: 4,
        priceUsd: 10,
        hasDivisaDiscount: true,
        divisaDiscountAmount: 2,
        isActive: true,
      },
    ];
  });

  it('loads shifts on mount and sorts active shifts first', () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    expect(mockLoadShifts).toHaveBeenCalledTimes(1);
    expect(result.current.shifts[0].label).toBe('Turno Mañana');
    expect(result.current.shifts[1].label).toBe('Turno Tarde');
  });

  it('opens and populates form for creating and editing', () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    act(() => {
      result.current.onOpenNew();
    });

    expect(result.current.formOpen).toBe(true);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.formValues.label).toBe('');

    act(() => {
      result.current.onEdit(mockShifts[0]);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.formValues.label).toBe('Turno Tarde');
    expect(result.current.formValues.hours).toBe('6');
  });

  it('validates required fields before submitting', async () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    act(() => {
      result.current.onOpenNew();
      result.current.setFormValues({
        label: '',
        hours: '4',
        priceUsd: '10',
        hasDivisaDiscount: false,
        divisaDiscountAmount: '0',
        isActive: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.formError).toBe('El nombre del turno es obligatorio.');
    expect(mockAddShift).not.toHaveBeenCalled();

    act(() => {
      result.current.setFormValues({
        label: 'Turno Test',
        hours: '0',
        priceUsd: '10',
        hasDivisaDiscount: false,
        divisaDiscountAmount: '0',
        isActive: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.formError).toBe(
      'La duración debe ser un entero mayor a cero.'
    );
  });

  it('submits a valid new shift and closes the form', async () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    act(() => {
      result.current.onOpenNew();
      result.current.setFormValues({
        label: 'Turno Noche',
        hours: '8',
        priceUsd: '20',
        hasDivisaDiscount: true,
        divisaDiscountAmount: '3',
        isActive: true,
      });
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockAddShift).toHaveBeenCalledWith({
      label: 'Turno Noche',
      hours: 8,
      priceUsd: 20,
      hasDivisaDiscount: true,
      divisaDiscountAmount: 3,
      isActive: true,
    });
    expect(toast.success).toHaveBeenCalledWith('Turno creado');
    expect(result.current.formOpen).toBe(false);
  });

  it('toggles shift active status', async () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    await act(async () => {
      await result.current.onToggleActive(mockShifts[1]);
    });

    expect(mockUpdateShift).toHaveBeenCalledWith('shift-2', { isActive: false });
    expect(toast.success).toHaveBeenCalledWith('Turno desactivado');
  });

  it('handles delete flow with confirmation', async () => {
    const { result } = renderHook(() => useConfiguracionTurnosViewModel());

    act(() => {
      result.current.onDeleteClick(mockShifts[0]);
    });

    expect(result.current.deleteOpen).toBe(true);
    expect(result.current.shiftToDelete).toEqual(mockShifts[0]);

    await act(async () => {
      await result.current.onDeleteConfirm();
    });

    expect(mockDeleteShift).toHaveBeenCalledWith('shift-1');
    expect(toast.success).toHaveBeenCalledWith('Turno eliminado');
    expect(result.current.deleteOpen).toBe(false);
  });
});
