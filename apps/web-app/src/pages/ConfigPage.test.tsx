import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigPage } from './ConfigPage';
import { useConfigStore } from '@/store/useConfigStore';

vi.mock('@/components/layout/Header', () => ({
  Header: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
}));

describe('ConfigPage mixed payment settings', () => {
  beforeEach(() => {
    useConfigStore.setState({
      mixedPaymentFlags: {
        enabled: false,
        water: false,
        rentals: false,
      },
      config: {
        ...useConfigStore.getState().config,
        lastUpdated: '2026-03-07T10:00:00.000Z',
      },
    });
  });

  it('does not render mixed payment controls in settings UI', () => {
    render(<ConfigPage />);

    expect(screen.queryByText('Pago Mixto')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Habilitar pago mixto global')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pago mixto en ventas de agua')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Pago mixto en alquileres')
    ).not.toBeInTheDocument();
  });
});
