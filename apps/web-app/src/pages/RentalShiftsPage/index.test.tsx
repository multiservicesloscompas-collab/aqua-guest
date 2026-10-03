import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LEGACY_SHIFT_CATALOG,
  type RentalShiftCatalogEntry,
} from '@aqua-guest/domain';
import { useRentalShiftStore } from '@/store/useRentalShiftStore';
import RentalShiftsPage from './index';

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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const NOCTURNO: RentalShiftCatalogEntry = {
  id: 'uuid-nocturno',
  code: 'NOCTURNO',
  label: 'Nocturno',
  priceUsd: 5,
  hours: 12,
  divisaDiscountUsd: 1,
};

function setOnline(isOnline: boolean) {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    configurable: true,
    value: isOnline,
  });
}

async function openNewShiftForm() {
  await userEvent.click(screen.getByTestId('shifts-add-button'));
}

async function fillForm(values: {
  label?: string;
  hours?: string;
  price?: string;
}) {
  if (values.label !== undefined) {
    await userEvent.type(screen.getByTestId('shift-form-label'), values.label);
  }
  if (values.hours !== undefined) {
    await userEvent.type(screen.getByTestId('shift-form-hours'), values.hours);
  }
  if (values.price !== undefined) {
    await userEvent.type(screen.getByTestId('shift-form-price'), values.price);
  }
}

describe('RentalShiftsPage', () => {
  beforeEach(() => {
    Object.values(dataServiceMock).forEach((mock) => mock.mockReset());
    useRentalShiftStore.setState({ shifts: [...LEGACY_SHIFT_CATALOG] });
    setOnline(true);
  });

  it('lists the catalog with code, duration and price', () => {
    // Arrange / Act
    render(<RentalShiftsPage />);

    // Assert
    expect(screen.getByTestId('shift-label-completo')).toHaveTextContent(
      'Completo'
    );
    expect(screen.getByTestId('shift-code-completo')).toHaveTextContent(
      'COMPLETO'
    );
    expect(screen.getByTestId('shift-duration-completo')).toHaveTextContent(
      '1 día'
    );
    expect(screen.getByTestId('shift-price-completo')).toHaveTextContent(
      '$6.00'
    );
    expect(screen.getByTestId('shift-discount-completo')).toHaveTextContent(
      '$1.00'
    );
    expect(
      screen.queryByTestId('shift-discount-medio')
    ).not.toBeInTheDocument();
  });

  it('previews the code derived from the label while creating', async () => {
    // Arrange
    render(<RentalShiftsPage />);
    await openNewShiftForm();

    // Act
    await fillForm({ label: 'Turno Nocturno' });

    // Assert
    expect(screen.getByTestId('shift-form-code-preview')).toHaveTextContent(
      'TURNO_NOCTURNO'
    );
  });

  it('creates a shift and shows it in the list', async () => {
    // Arrange
    dataServiceMock.create.mockResolvedValue(NOCTURNO);
    render(<RentalShiftsPage />);
    await openNewShiftForm();
    await fillForm({ label: 'Nocturno', hours: '12', price: '5' });

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('shift-card-uuid-nocturno')).toBeInTheDocument()
    );
    expect(dataServiceMock.create).toHaveBeenCalledWith({
      label: 'Nocturno',
      priceUsd: 5,
      hours: 12,
      divisaDiscountUsd: 0,
    });
  });

  it('sends the divisa discount when the switch is on', async () => {
    // Arrange
    dataServiceMock.create.mockResolvedValue(NOCTURNO);
    render(<RentalShiftsPage />);
    await openNewShiftForm();
    await fillForm({ label: 'Nocturno', hours: '12', price: '5' });
    await userEvent.click(screen.getByTestId('shift-form-discount-toggle'));
    await userEvent.type(screen.getByTestId('shift-form-discount'), '1');

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    await waitFor(() => expect(dataServiceMock.create).toHaveBeenCalled());
    expect(dataServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ divisaDiscountUsd: 1 })
    );
  });

  it('shows every validation error and does not save an empty form', async () => {
    // Arrange
    render(<RentalShiftsPage />);
    await openNewShiftForm();

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    const errors = screen.getByTestId('shift-form-errors');
    expect(errors).toHaveTextContent('Escribe el nombre del turno');
    expect(errors).toHaveTextContent('El precio debe ser');
    expect(errors).toHaveTextContent('La duración debe ser');
    expect(dataServiceMock.create).not.toHaveBeenCalled();
  });

  it('rejects a discount greater than the price', async () => {
    // Arrange
    render(<RentalShiftsPage />);
    await openNewShiftForm();
    await fillForm({ label: 'Nocturno', hours: '12', price: '5' });
    await userEvent.click(screen.getByTestId('shift-form-discount-toggle'));
    await userEvent.type(screen.getByTestId('shift-form-discount'), '9');

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    expect(screen.getByTestId('shift-form-errors')).toHaveTextContent(
      'El descuento no puede ser mayor que el precio'
    );
    expect(dataServiceMock.create).not.toHaveBeenCalled();
  });

  it('edits a shift sending only what changed and keeps its code', async () => {
    // Arrange
    dataServiceMock.update.mockResolvedValue(undefined);
    render(<RentalShiftsPage />);
    await userEvent.click(screen.getByTestId('shift-edit-completo'));
    const price = screen.getByTestId('shift-form-price');
    await userEvent.clear(price);
    await userEvent.type(price, '8');

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    await waitFor(() =>
      expect(dataServiceMock.update).toHaveBeenCalledWith('completo', {
        priceUsd: 8,
      })
    );
    expect(screen.getByTestId('shift-price-completo')).toHaveTextContent(
      '$8.00'
    );
    expect(screen.getByTestId('shift-code-completo')).toHaveTextContent(
      'COMPLETO'
    );
  });

  it('shows the fixed code and a hint while editing', async () => {
    // Arrange
    render(<RentalShiftsPage />);

    // Act
    await userEvent.click(screen.getByTestId('shift-edit-doble'));

    // Assert
    expect(screen.getByTestId('shift-form-code-preview')).toHaveTextContent(
      'DOBLE'
    );
    expect(screen.getByText(/no cambia al editar/)).toBeInTheDocument();
  });

  it('does not call the service when an edit changes nothing', async () => {
    // Arrange
    render(<RentalShiftsPage />);
    await userEvent.click(screen.getByTestId('shift-edit-medio'));

    // Act
    await userEvent.click(screen.getByTestId('shift-form-submit'));

    // Assert
    expect(dataServiceMock.update).not.toHaveBeenCalled();
  });

  it('deletes a shift after confirming and removes it from the list', async () => {
    // Arrange
    dataServiceMock.softDelete.mockResolvedValue(undefined);
    render(<RentalShiftsPage />);
    await userEvent.click(screen.getByTestId('shift-delete-doble'));

    // Act
    await userEvent.click(screen.getByTestId('confirm-delete-confirm'));

    // Assert
    await waitFor(() =>
      expect(screen.queryByTestId('shift-card-doble')).not.toBeInTheDocument()
    );
    expect(dataServiceMock.softDelete).toHaveBeenCalledWith('doble');
  });

  it('keeps the shift when the deletion is cancelled', async () => {
    // Arrange
    render(<RentalShiftsPage />);
    await userEvent.click(screen.getByTestId('shift-delete-doble'));

    // Act
    await userEvent.click(screen.getByTestId('confirm-delete-cancel'));

    // Assert
    expect(screen.getByTestId('shift-card-doble')).toBeInTheDocument();
    expect(dataServiceMock.softDelete).not.toHaveBeenCalled();
  });

  it('disables deleting when only one shift is left', () => {
    // Arrange
    useRentalShiftStore.setState({ shifts: [NOCTURNO] });

    // Act
    render(<RentalShiftsPage />);

    // Assert
    expect(screen.getByTestId('shift-delete-uuid-nocturno')).toBeDisabled();
    expect(screen.getByTestId('shift-edit-uuid-nocturno')).toBeEnabled();
  });

  it('blocks every management action and explains why while offline', () => {
    // Arrange
    setOnline(false);

    // Act
    render(<RentalShiftsPage />);

    // Assert
    expect(screen.getByTestId('shifts-offline-notice')).toBeInTheDocument();
    expect(screen.getByTestId('shifts-add-button')).toBeDisabled();
    expect(screen.getByTestId('shift-edit-completo')).toBeDisabled();
    expect(screen.getByTestId('shift-delete-completo')).toBeDisabled();
  });

  it('does not show the offline notice while online', () => {
    // Arrange / Act
    render(<RentalShiftsPage />);

    // Assert
    expect(
      screen.queryByTestId('shifts-offline-notice')
    ).not.toBeInTheDocument();
  });
});
