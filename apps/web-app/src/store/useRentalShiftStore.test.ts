import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEGACY_SHIFT_CATALOG,
  type RentalShiftCatalogEntry,
} from '@aqua-guest/domain';
import {
  getShiftCatalog,
  SHIFT_MANAGEMENT_OFFLINE_ERROR,
  useRentalShiftStore,
} from './useRentalShiftStore';

const { dataServiceMock } = vi.hoisted(() => ({
  dataServiceMock: {
    listActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock('@/services/rentals/RentalShiftsDataService', () => ({
  rentalShiftsDataService: dataServiceMock,
}));

const NOCTURNO: RentalShiftCatalogEntry = {
  id: 'uuid-nocturno',
  code: 'NOCTURNO',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 0,
};

const DRAFT = {
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 0,
};

function setOnline(isOnline: boolean) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: isOnline },
  });
}

describe('useRentalShiftStore', () => {
  beforeEach(() => {
    Object.values(dataServiceMock).forEach((mock) => mock.mockReset());
    useRentalShiftStore.setState({ shifts: [] });
    setOnline(true);
  });

  describe('getShiftCatalog', () => {
    it('falls back to the legacy shifts while nothing was loaded', () => {
      // Arrange / Act / Assert
      expect(getShiftCatalog()).toEqual(LEGACY_SHIFT_CATALOG);
    });

    it('returns the loaded shifts once there are some', () => {
      // Arrange
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act / Assert
      expect(getShiftCatalog()).toEqual([NOCTURNO]);
    });
  });

  describe('loadShifts', () => {
    it('stores the active shifts from the data service', async () => {
      // Arrange
      dataServiceMock.listActive.mockResolvedValue([NOCTURNO]);

      // Act
      await useRentalShiftStore.getState().loadShifts();

      // Assert
      expect(useRentalShiftStore.getState().shifts).toEqual([NOCTURNO]);
    });

    it('keeps the cached shifts and does not throw when loading fails', async () => {
      // Arrange
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });
      dataServiceMock.listActive.mockRejectedValue(new Error('network'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

      // Act
      await useRentalShiftStore.getState().loadShifts();

      // Assert
      expect(useRentalShiftStore.getState().shifts).toEqual([NOCTURNO]);
      errorSpy.mockRestore();
    });

    it('keeps the legacy fallback when the catalog comes back empty', async () => {
      // Arrange
      dataServiceMock.listActive.mockResolvedValue([]);

      // Act
      await useRentalShiftStore.getState().loadShifts();

      // Assert
      expect(getShiftCatalog()).toEqual(LEGACY_SHIFT_CATALOG);
    });
  });

  describe('addShift', () => {
    it('creates the shift and adds it to the store', async () => {
      // Arrange
      dataServiceMock.create.mockResolvedValue(NOCTURNO);
      useRentalShiftStore.setState({ shifts: [...LEGACY_SHIFT_CATALOG] });

      // Act
      const created = await useRentalShiftStore.getState().addShift(DRAFT);

      // Assert
      expect(created).toEqual(NOCTURNO);
      expect(useRentalShiftStore.getState().shifts).toContainEqual(NOCTURNO);
    });

    it('rejects an invalid draft without calling the data service', async () => {
      // Arrange / Act
      const result = useRentalShiftStore
        .getState()
        .addShift({ ...DRAFT, hours: 0 });

      // Assert
      await expect(result).rejects.toThrow();
      expect(dataServiceMock.create).not.toHaveBeenCalled();
    });

    it('refuses to write while offline', async () => {
      // Arrange
      setOnline(false);

      // Act
      const result = useRentalShiftStore.getState().addShift(DRAFT);

      // Assert
      await expect(result).rejects.toThrow(SHIFT_MANAGEMENT_OFFLINE_ERROR);
      expect(dataServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('updateShift', () => {
    it('updates the shift in the data service and in the store', async () => {
      // Arrange
      dataServiceMock.update.mockResolvedValue(undefined);
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act
      await useRentalShiftStore
        .getState()
        .updateShift(NOCTURNO.id, { priceUsd: 9 });

      // Assert
      expect(dataServiceMock.update).toHaveBeenCalledWith(NOCTURNO.id, {
        priceUsd: 9,
      });
      expect(useRentalShiftStore.getState().shifts[0].priceUsd).toBe(9);
    });

    it('keeps the code unchanged', async () => {
      // Arrange
      dataServiceMock.update.mockResolvedValue(undefined);
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act
      await useRentalShiftStore
        .getState()
        .updateShift(NOCTURNO.id, { label: 'Madrugada' });

      // Assert
      expect(useRentalShiftStore.getState().shifts[0].code).toBe('NOCTURNO');
    });

    it('rejects an update that would leave the shift invalid', async () => {
      // Arrange
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act
      const result = useRentalShiftStore
        .getState()
        .updateShift(NOCTURNO.id, { divisaDiscountUsd: 50 });

      // Assert
      await expect(result).rejects.toThrow();
      expect(dataServiceMock.update).not.toHaveBeenCalled();
    });

    it('refuses to write while offline', async () => {
      // Arrange
      setOnline(false);
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act
      const result = useRentalShiftStore
        .getState()
        .updateShift(NOCTURNO.id, { priceUsd: 9 });

      // Assert
      await expect(result).rejects.toThrow(SHIFT_MANAGEMENT_OFFLINE_ERROR);
    });
  });

  describe('deleteShift', () => {
    it('soft deletes the shift and removes it from the store', async () => {
      // Arrange
      dataServiceMock.softDelete.mockResolvedValue(undefined);
      useRentalShiftStore.setState({
        shifts: [NOCTURNO, LEGACY_SHIFT_CATALOG[0]],
      });

      // Act
      await useRentalShiftStore.getState().deleteShift(NOCTURNO.id);

      // Assert
      expect(dataServiceMock.softDelete).toHaveBeenCalledWith(NOCTURNO.id);
      expect(useRentalShiftStore.getState().shifts).toEqual([
        LEGACY_SHIFT_CATALOG[0],
      ]);
    });

    it('refuses to delete the last remaining shift', async () => {
      // Arrange
      useRentalShiftStore.setState({ shifts: [NOCTURNO] });

      // Act
      const result = useRentalShiftStore.getState().deleteShift(NOCTURNO.id);

      // Assert
      await expect(result).rejects.toThrow();
      expect(dataServiceMock.softDelete).not.toHaveBeenCalled();
    });

    it('refuses to write while offline', async () => {
      // Arrange
      setOnline(false);
      useRentalShiftStore.setState({
        shifts: [NOCTURNO, LEGACY_SHIFT_CATALOG[0]],
      });

      // Act
      const result = useRentalShiftStore.getState().deleteShift(NOCTURNO.id);

      // Assert
      await expect(result).rejects.toThrow(SHIFT_MANAGEMENT_OFFLINE_ERROR);
    });
  });
});
