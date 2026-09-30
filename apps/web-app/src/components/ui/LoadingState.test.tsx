import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LoadingState } from './LoadingState';

// The spec tsconfig has no DOM lib, so HTMLElement does not expose these members.
interface QueryableContainer {
  firstElementChild: HTMLElement | null;
  querySelector(selector: string): HTMLElement | null;
}

const renderLoadingState = (message: string) => {
  const { container } = render(<LoadingState message={message} />);
  return container as unknown as QueryableContainer;
};

describe('LoadingState', () => {
  it('shows the message it receives', () => {
    // Arrange / Act
    renderLoadingState('Cargando ventas...');

    // Assert
    expect(screen.getByText('Cargando ventas...')).toBeInTheDocument();
  });

  it('styles the message as small medium-weight text', () => {
    // Arrange / Act
    renderLoadingState('Cargando...');

    // Assert
    expect(screen.getByText('Cargando...')).toHaveClass(
      'text-sm',
      'font-medium'
    );
  });

  it('keeps the centered muted layout of the previous inline blocks', () => {
    // Arrange / Act
    const container = renderLoadingState('Cargando...');

    // Assert
    expect(container.firstElementChild).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'text-muted-foreground'
    );
  });

  it('renders a spinning icon next to the message', () => {
    // Arrange / Act
    const container = renderLoadingState('Cargando...');

    // Assert
    expect(container.querySelector('svg')).toHaveClass(
      'w-8',
      'h-8',
      'mb-3',
      'animate-spin'
    );
  });
});
