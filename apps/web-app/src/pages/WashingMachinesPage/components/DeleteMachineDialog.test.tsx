import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeleteMachineDialog } from './DeleteMachineDialog';

const renderDialog = (overrides: { isDeleting?: boolean } = {}) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <DeleteMachineDialog
      open
      onOpenChange={onOpenChange}
      machineName="Samsung 18kg"
      onConfirm={onConfirm}
      isDeleting={overrides.isDeleting ?? false}
    />
  );
  return { onConfirm, onOpenChange };
};

describe('DeleteMachineDialog', () => {
  it('shows the title and names the machine in the description', () => {
    // Arrange / Act
    renderDialog();

    // Assert
    expect(screen.getByText('Eliminar lavadora')).toBeInTheDocument();
    expect(
      screen.getByText(
        '¿Estás seguro de eliminar "Samsung 18kg"? Esta acción no se puede deshacer.'
      )
    ).toBeInTheDocument();
  });

  it('confirms the deletion', async () => {
    // Arrange
    const { onConfirm } = renderDialog();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('blocks both buttons while the machine is being deleted', () => {
    // Arrange / Act
    renderDialog({ isDeleting: true });

    // Assert
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });
});
