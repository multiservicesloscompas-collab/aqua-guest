import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXCHANGE_RATE } from '@aqua-guest/domain';
import { useConfigStore } from './useConfigStore';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

describe('useConfigStore defaults', () => {
  it('starts with a default exchange rate of 1000 Bs per USD', () => {
    // Arrange / Act
    const { exchangeRate } = useConfigStore.getInitialState().config;

    // Assert
    expect(DEFAULT_EXCHANGE_RATE).toBe(1000);
    expect(exchangeRate).toBe(DEFAULT_EXCHANGE_RATE);
  });
});
