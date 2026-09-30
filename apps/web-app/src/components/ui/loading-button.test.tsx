import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoadingButton } from './loading-button';

// The spec tsconfig has no DOM lib, so HTMLElement does not expose querySelector.
interface QueryableContainer {
  querySelector(selector: string): HTMLElement | null;
}

const spinnerOf = (container: unknown) =>
  (container as QueryableContainer).querySelector('svg');

describe('LoadingButton', () => {
  it('shows its children and no spinner when it is not loading', () => {
    // Arrange / Act
    const { container } = render(<LoadingButton>Guardar</LoadingButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(spinnerOf(container)).toBeNull();
  });

  it('shows a spinner and disables itself while loading', () => {
    // Arrange / Act
    const { container } = render(
      <LoadingButton loading>Guardar</LoadingButton>
    );

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
    expect(spinnerOf(container)).toHaveClass(
      'w-4',
      'h-4',
      'animate-spin',
      'mr-2'
    );
  });

  it('replaces the children with the loading text while loading', () => {
    // Arrange / Act
    render(
      <LoadingButton loading loadingText="Guardando...">
        Guardar
      </LoadingButton>
    );

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Guardando...');
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
  });

  it('keeps the children when loading has no loading text', () => {
    // Arrange / Act
    render(<LoadingButton loading>Guardar</LoadingButton>);

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Guardar');
  });

  it('stays disabled when disabled is set even if it is not loading', () => {
    // Arrange / Act
    render(<LoadingButton disabled>Guardar</LoadingButton>);

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards click handlers, classes, styles and data attributes', async () => {
    // Arrange
    const onClick = vi.fn();
    render(
      <LoadingButton
        onClick={onClick}
        className="w-full h-12"
        style={{ marginTop: '2rem' }}
        data-testid="save-button"
      >
        Guardar
      </LoadingButton>
    );

    // Act
    await userEvent.click(screen.getByTestId('save-button'));

    // Assert
    const button = screen.getByTestId('save-button');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass('w-full', 'h-12');
    expect(button).toHaveStyle({ marginTop: '2rem' });
  });
});
