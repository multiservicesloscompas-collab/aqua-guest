import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RentalSheetFooter } from './RentalSheetFooter';

// The spec tsconfig has no DOM lib, so HTMLElement does not expose querySelector.
interface QueryableContainer {
  querySelector(selector: string): HTMLElement | null;
}

const renderFooter = (overrides: { isSaving?: boolean } = {}) => {
  const onSubmit = vi.fn();
  const { container } = render(
    <RentalSheetFooter
      subtotalUsdText="10.00"
      tipAmountBs={12.5}
      totalUsdText="10.00"
      isSaving={overrides.isSaving ?? false}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit, container: container as unknown as QueryableContainer };
};

describe('RentalSheetFooter', () => {
  it('shows the subtotal and the tip', () => {
    // Arrange / Act
    renderFooter();

    // Assert
    expect(screen.getByText('Subtotal: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Propina: Bs 12.50')).toBeInTheDocument();
  });

  describe('when not saving', () => {
    it('shows an enabled confirm button with its test id', () => {
      // Arrange / Act
      renderFooter();

      // Assert
      const button = screen.getByTestId('rental-confirm-button');
      expect(button).toHaveTextContent('Confirmar Alquiler');
      expect(button).toBeEnabled();
    });

    it('does not show a spinner', () => {
      // Arrange / Act
      const { container } = renderFooter();

      // Assert
      expect(
        container.querySelector('[data-testid="rental-confirm-button"] svg')
      ).toBeNull();
    });

    it('submits when the button is pressed', async () => {
      // Arrange
      const { onSubmit } = renderFooter();

      // Act
      await userEvent.click(screen.getByTestId('rental-confirm-button'));

      // Assert
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('when saving', () => {
    it('shows a disabled button with the saving message', () => {
      // Arrange / Act
      renderFooter({ isSaving: true });

      // Assert
      const button = screen.getByTestId('rental-confirm-button');
      expect(button).toHaveTextContent('Registrando...');
      expect(button).toBeDisabled();
    });

    it('shows a spinner inside the button', () => {
      // Arrange / Act
      const { container } = renderFooter({ isSaving: true });

      // Assert
      expect(
        container.querySelector('[data-testid="rental-confirm-button"] svg')
      ).toHaveClass('w-4', 'h-4', 'animate-spin', 'mr-2');
    });

    it('does not submit when the disabled button is pressed', async () => {
      // Arrange
      const { onSubmit } = renderFooter({ isSaving: true });

      // Act
      await userEvent.click(screen.getByTestId('rental-confirm-button'));

      // Assert
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('keeps the full-width button size and its vertical margins', () => {
    // Arrange / Act
    renderFooter();

    // Assert
    const button = screen.getByTestId('rental-confirm-button');
    expect(button).toHaveClass('w-full', 'h-12', 'text-base', 'font-semibold');
    expect(button).toHaveStyle({ marginBottom: '4rem', marginTop: '2rem' });
  });
});
