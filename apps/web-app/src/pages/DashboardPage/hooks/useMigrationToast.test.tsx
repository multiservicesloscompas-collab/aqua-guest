import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useMigrationToast } from './useMigrationToast';
import { useMigrationStatusStore } from '@/store/useMigrationStatusStore';

vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }));
vi.mock('@/lib/supabaseClient', () => ({ default: { rpc: vi.fn() } }));

function setStore(
  state: 'up-to-date' | 'pending' | 'unknown',
  pending: string[]
) {
  useMigrationStatusStore.setState({
    state,
    pending,
    notified: false,
    check: vi.fn(),
  });
}

describe('useMigrationToast', () => {
  beforeEach(() => {
    vi.mocked(toast.warning).mockClear();
  });

  it('shows a 15 second warning when migrations are pending', () => {
    // Arrange
    setStore('pending', ['20261001000000', '20261001000100']);

    // Act
    renderHook(() => useMigrationToast());

    // Assert
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      'Base de datos desactualizada',
      expect.objectContaining({
        duration: 15000,
        description:
          'Faltan 2 migraciones. Ejecuta npm run db:migrate para aplicarlas.',
      })
    );
  });

  it('shows the warning only once per session when the dashboard is opened again', () => {
    // Arrange
    setStore('pending', ['20261001000000']);

    // Act
    const first = renderHook(() => useMigrationToast());
    first.unmount();
    renderHook(() => useMigrationToast());

    // Assert
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it.each(['up-to-date', 'unknown'] as const)(
    'shows nothing when the state is %s',
    (state) => {
      // Arrange
      setStore(state, []);

      // Act
      renderHook(() => useMigrationToast());

      // Assert
      expect(toast.warning).not.toHaveBeenCalled();
    }
  );

  it('checks the migrations when the dashboard opens', () => {
    // Arrange
    const check = vi.fn();
    useMigrationStatusStore.setState({
      state: 'unknown',
      pending: [],
      notified: false,
      check,
    });

    // Act
    renderHook(() => useMigrationToast());

    // Assert
    expect(check).toHaveBeenCalledTimes(1);
  });
});
