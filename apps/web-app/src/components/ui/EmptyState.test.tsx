import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wallet } from 'lucide-react';

import { EmptyState } from './EmptyState';

// The spec tsconfig has no DOM lib, so HTMLElement does not expose these members.
interface QueryableContainer {
  firstElementChild: HTMLElement | null;
  querySelector(selector: string): HTMLElement | null;
}

const renderEmptyState = () => {
  const { container } = render(
    <EmptyState
      icon={Wallet}
      title="Sin egresos este día"
      hint="Presiona + para registrar un gasto"
    />
  );
  return container as unknown as QueryableContainer;
};

describe('EmptyState', () => {
  it('shows the title and the hint', () => {
    // Arrange / Act
    renderEmptyState();

    // Assert
    expect(screen.getByText('Sin egresos este día')).toBeInTheDocument();
    expect(
      screen.getByText('Presiona + para registrar un gasto')
    ).toBeInTheDocument();
  });

  it('styles the title as medium text and the hint as extra small text', () => {
    // Arrange / Act
    renderEmptyState();

    // Assert
    expect(screen.getByText('Sin egresos este día')).toHaveClass(
      'text-sm',
      'font-medium'
    );
    expect(screen.getByText('Presiona + para registrar un gasto')).toHaveClass(
      'text-xs'
    );
  });

  it('keeps the centered muted layout of the previous inline blocks', () => {
    // Arrange / Act
    const container = renderEmptyState();

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

  it('renders the given icon faded above the text', () => {
    // Arrange / Act
    const container = renderEmptyState();

    // Assert
    expect(container.querySelector('svg')).toHaveClass(
      'w-12',
      'h-12',
      'mb-3',
      'opacity-40'
    );
  });
});
