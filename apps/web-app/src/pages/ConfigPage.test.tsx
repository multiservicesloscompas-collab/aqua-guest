import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfigPage } from './ConfigPage';
import { useConfigStore } from '@/store/useConfigStore';

const { clearLocalAppCacheMock, toastSuccessMock, toastErrorMock, reloadMock } =
  vi.hoisted(() => ({
    clearLocalAppCacheMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
    reloadMock: vi.fn(),
  }));

vi.mock('@/services/cache/clearLocalAppCache', () => ({
  clearLocalAppCache: clearLocalAppCacheMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

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
    clearLocalAppCacheMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    reloadMock.mockReset();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: globalThis,
    });

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      writable: true,
      value: { reload: reloadMock },
    });

    useConfigStore.setState({
      mixedPaymentFlags: {
        enabled: false,
        water: false,
        rentals: false,
        expenses: false,
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

  it('shows clear cache action only in Más opciones with local-only scope message', () => {
    render(<ConfigPage />);

    expect(screen.getByText('Más opciones')).toBeInTheDocument();
    expect(screen.getByText('Limpiar cache')).toBeInTheDocument();
    expect(
      screen.getByText(/No elimina información del servidor/i)
    ).toBeInTheDocument();
  });

  it('requires confirmation before clearing cache and reloads app when confirmed', async () => {
    clearLocalAppCacheMock.mockResolvedValueOnce(undefined);

    render(<ConfigPage />);

    fireEvent.click(screen.getByText('Limpiar cache'));

    expect(clearLocalAppCacheMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Confirmar limpieza'));

    await waitFor(() => {
      expect(clearLocalAppCacheMock).toHaveBeenCalledTimes(1);
    });

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Cache local limpiada. Recargando la app...'
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('shows error toast when cache cleanup fails', async () => {
    clearLocalAppCacheMock.mockRejectedValueOnce(new Error('boom'));

    render(<ConfigPage />);

    fireEvent.click(screen.getByText('Limpiar cache'));
    fireEvent.click(screen.getByText('Confirmar limpieza'));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'No se pudo limpiar la cache local'
      );
    });

    expect(reloadMock).not.toHaveBeenCalled();
  });
});
