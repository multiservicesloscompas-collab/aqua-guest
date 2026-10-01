import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from './useAppStore';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: fromMock };
  return { default: client, supabase: client };
});

function emptyQuery(result: { data: unknown[] | null }) {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'limit']) {
    chain[method] = () => chain;
  }
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

describe('useAppStore.loadFromSupabase coreLoadedAt (FIN-12)', () => {
  beforeEach(() => {
    fromMock.mockReset();
    useAppStore.setState({ coreLoadedAt: 0 });
  });

  it('stamps coreLoadedAt when the global sync finishes', async () => {
    // Arrange
    fromMock.mockImplementation(() => emptyQuery({ data: [] }));

    // Act
    await useAppStore.getState().loadFromSupabase();

    // Assert
    expect(useAppStore.getState().coreLoadedAt).toBeGreaterThan(0);
  });

  it('stamps coreLoadedAt even when the global sync fails', async () => {
    fromMock.mockImplementation(() => {
      throw new Error('network down');
    });

    await useAppStore.getState().loadFromSupabase();

    expect(useAppStore.getState().coreLoadedAt).toBeGreaterThan(0);
  });
});
