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

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerContent: ({
    className,
    children,
  }: {
    className?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="drawer-content"
      className={className}
    >
      {children}
    </div>
  ),
  DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerClose: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

    const content = screen.getByTestId('drawer-content');

    expect(content).toHaveClass('rounded-t-3xl');
    expect(content).not.toHaveClass('h-full');
  });

  it('uses side panel styles in tablet mode', () => {
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

    const content = screen.getByTestId('drawer-content');

    expect(content).toHaveClass('rounded-none');
    expect(content).toHaveClass('h-full');
    expect(content).toHaveClass('border-l');
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
      screen.getByRole('button', { name: 'Ir a Entregas' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Clientes' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Propinas' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Transacciones' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Egresos' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ir a Configuración Global' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir a Propinas' }));

    expect(onNavigate).toHaveBeenCalledWith('propinas');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
