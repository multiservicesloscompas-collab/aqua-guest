import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SalesChart } from './SalesChart';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('SalesChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not warn about a negative chart size on its first render', () => {
    // Arrange
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const data = [{ label: 'L', value: 1 }];

    // Act
    render(<SalesChart data={data} />);

    // Assert
    const negativeSizeWarnings = warn.mock.calls.filter(([message]) =>
      String(message).includes('width(-1)')
    );
    expect(negativeSizeWarnings).toEqual([]);
  });
});
