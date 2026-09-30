import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

const baseProps = {
  title: '¿Eliminar egreso?',
  description: 'Esta acción no se puede deshacer.',
  onConfirm: vi.fn(),
};

describe('ConfirmDeleteDialog', () => {
  it('shows the title and description when open', () => {
    // Arrange / Act
    render(<ConfirmDeleteDialog {...baseProps} open onOpenChange={vi.fn()} />);

    // Assert
    expect(screen.getByText('¿Eliminar egreso?')).toBeInTheDocument();
    expect(
      screen.getByText('Esta acción no se puede deshacer.')
    ).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    // Arrange / Act
    render(
      <ConfirmDeleteDialog {...baseProps} open={false} onOpenChange={vi.fn()} />
    );

    // Assert
    expect(screen.queryByText('¿Eliminar egreso?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when the delete button is pressed', async () => {
    // Arrange
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        {...baseProps}
        onConfirm={onConfirm}
        open
        onOpenChange={vi.fn()}
      />
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('asks to close when cancel is pressed without confirming', async () => {
    // Arrange
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDeleteDialog
        {...baseProps}
        onConfirm={onConfirm}
        open
        onOpenChange={onOpenChange}
      />
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('styles the delete button as destructive with a hover state', () => {
    // Arrange / Act
    render(<ConfirmDeleteDialog {...baseProps} open onOpenChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground',
      'hover:bg-destructive/90'
    );
  });

  describe('while deleting', () => {
    it('disables both buttons and shows a spinner instead of the label', () => {
      // Arrange / Act
      render(
        <ConfirmDeleteDialog
          {...baseProps}
          open
          onOpenChange={vi.fn()}
          isDeleting
        />
      );

      // Assert
      expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach((button) => expect(button).toBeDisabled());
    });

    it('keeps the label when another item is the one being deleted', () => {
      // Arrange / Act
      render(
        <ConfirmDeleteDialog
          {...baseProps}
          open
          onOpenChange={vi.fn()}
          isDeleting
          showSpinner={false}
        />
      );

      // Assert
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });

    it('does not call onConfirm when the disabled button is pressed', async () => {
      // Arrange
      const onConfirm = vi.fn();
      render(
        <ConfirmDeleteDialog
          {...baseProps}
          onConfirm={onConfirm}
          open
          onOpenChange={vi.fn()}
          isDeleting
          showSpinner={false}
        />
      );

      // Act
      await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

      // Assert
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  it('applies extra classes to the dialog content', () => {
    // Arrange / Act
    render(
      <ConfirmDeleteDialog
        {...baseProps}
        open
        onOpenChange={vi.fn()}
        contentClassName="max-w-[90vw] rounded-xl"
      />
    );

    // Assert
    expect(screen.getByRole('alertdialog')).toHaveClass(
      'max-w-[90vw]',
      'rounded-xl'
    );
  });

  it('opens from its own trigger when it is not controlled', async () => {
    // Arrange
    render(
      <ConfirmDeleteDialog
        {...baseProps}
        trigger={<button type="button">Abrir borrado</button>}
      />
    );
    expect(screen.queryByText('¿Eliminar egreso?')).not.toBeInTheDocument();

    // Act
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir borrado' })
    );

    // Assert
    expect(screen.getByText('¿Eliminar egreso?')).toBeInTheDocument();
  });
});
