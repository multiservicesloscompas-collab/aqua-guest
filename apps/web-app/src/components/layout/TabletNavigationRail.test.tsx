import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { TabletNavigationRail } from './TabletNavigationRail';

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

describe('TabletNavigationRail', () => {
  it('does not render in mobile viewport', () => {
    viewportState.viewportMode = 'mobile';
    viewportState.isMobileViewport = true;
    viewportState.isTabletViewport = false;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(screen.queryByTestId('tablet-navigation-rail')).toBeNull();
  });

  it('renders sidebar in tablet-landscape with viewport metadata', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="ventas"
        onNavigate={() => undefined}
      />
    );

    const rail = screen.getByTestId('tablet-navigation-rail');
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveAttribute('data-viewport-mode', 'tablet-landscape');
  });

  it('renders sidebar in tablet-portrait with viewport metadata', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    const rail = screen.getByTestId('tablet-navigation-rail');
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveAttribute('data-viewport-mode', 'tablet-portrait');
  });

  it('navigates to dashboard when Inicio button is clicked', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    const onNavigate = vi.fn();

    render(
      <TabletNavigationRail currentRoute="ventas" onNavigate={onNavigate} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('navigates to ventas when Ventas button is clicked', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    const onNavigate = vi.fn();

    render(
      <TabletNavigationRail currentRoute="dashboard" onNavigate={onNavigate} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ventas' }));
    expect(onNavigate).toHaveBeenCalledWith('ventas');
  });

  it('marks the active route with aria-current="page"', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="alquiler"
        onNavigate={() => undefined}
      />
    );

    const activeButton = screen.getByRole('button', { name: 'Alquiler' });
    expect(activeButton).toHaveAttribute('aria-current', 'page');

    const inactiveButton = screen.getByRole('button', { name: 'Inicio' });
    expect(inactiveButton).not.toHaveAttribute('aria-current');
  });

  it('renders all primary module buttons (Inicio, Ventas, Alquiler)', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ventas' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Alquiler' })
    ).toBeInTheDocument();
  });

  it('renders all operations module buttons (Seguimiento, Entregas, Prepagados)', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Seguimiento' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Entregas' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Prepagados' })
    ).toBeInTheDocument();
  });

  it('renders all finance module buttons (Egresos, Equilibrio, Clientes)', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: 'Egresos' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Equilibrio' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clientes' })
    ).toBeInTheDocument();
  });

  it('renders the settings (Configuración) button', () => {
    viewportState.viewportMode = 'tablet-landscape';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Configuración' })
    ).toBeInTheDocument();
  });

  it('does NOT render a "Abrir más opciones" button (no 3-dot menu)', () => {
    viewportState.viewportMode = 'tablet-portrait';
    viewportState.isMobileViewport = false;
    viewportState.isTabletViewport = true;

    render(
      <TabletNavigationRail
        currentRoute="dashboard"
        onNavigate={() => undefined}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Abrir más opciones' })
    ).toBeNull();
  });
});
