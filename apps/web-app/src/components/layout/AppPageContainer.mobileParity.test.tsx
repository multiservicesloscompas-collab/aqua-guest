import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AppPageContainer } from './AppPageContainer';

vi.mock('@/hooks/responsive/useViewportMode', () => ({
  useViewportMode: () => ({
    viewportMode: 'mobile',
    isMobileViewport: true,
    isTabletViewport: false,
  }),
}));

describe('AppPageContainer mobile parity guard rails', () => {
  it('keeps legacy mobile container tokens under 768px', () => {
    render(
      <AppPageContainer>
        <div>Contenido</div>
      </AppPageContainer>
    );

    const container = screen.getByTestId('app-page-container');

    expect(container).toHaveClass('max-w-lg');
    expect(container).toHaveClass('px-4');
    expect(container).toHaveClass('py-4');
    expect(container).toHaveAttribute('data-viewport-mode', 'mobile');
  });
});
