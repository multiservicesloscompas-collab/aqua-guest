import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { MenuSheet } from './MenuSheet';

const viewportState = vi.hoisted(() => ({
  viewportMode: 'mobile' as
    | 'mobile'
    | 'tablet-portrait'
    | 'tablet-landscape'
    | 'desktop-or-other',
  isMobileViewport: true,
  isTabletViewport: false,
}));

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => viewportState,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({
    side,
    tabletSide,
    className,
    tabletClassName,
    children,
  }: {
    side?: string;
    tabletSide?: string;
    className?: string;
    tabletClassName?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="sheet-content"
      data-side={side}
      data-tablet-side={tabletSide}
      data-tablet-class={tabletClassName}
      className={className}
    >
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

describe('MenuSheet responsive behavior', () => {
  it('keeps mobile bottom sheet variant under 768px', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isMobileViewport = true;
    viewportState.isTabletViewport = false;

    render(
      <MenuSheet
        open
        onOpenChange={() => undefined}
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    const content = screen.getByTestId('sheet-content');

    expect(content).toHaveAttribute('data-side', 'bottom');
    expect(content).toHaveClass('rounded-t-3xl');
  });

  it('uses right side panel in tablet mode', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <MenuSheet
        open
        onOpenChange={() => undefined}
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    const content = screen.getByTestId('sheet-content');

    expect(content).toHaveAttribute('data-side', 'right');
    expect(content).toHaveAttribute('data-tablet-side', 'right');
    expect(content).toHaveAttribute(
      'data-tablet-class',
      expect.stringContaining('rounded-none')
    );
  });

  it('shows key modules and navigates when a menu item is pressed', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isMobileViewport = true;
    viewportState.isTabletViewport = false;

    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <MenuSheet
        open
        onOpenChange={onOpenChange}
        currentRoute="dashboard"
        onNavigate={onNavigate}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Ir a Prepagados' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Métricas de agua' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Transacciones' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Equilibrio de pagos' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir a Prepagados' }));

    expect(onNavigate).toHaveBeenCalledWith('prepagados');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
