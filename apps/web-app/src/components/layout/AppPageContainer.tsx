import { type ReactNode } from 'react';

import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { APP_PAGE_CONTAINER_TOKENS } from '@/lib/responsive/layoutTokens';
import { cn } from '@/lib/utils';

interface AppPageContainerProps {
  children: ReactNode;
  className?: string;
}

export function AppPageContainer({
  children,
  className,
}: AppPageContainerProps) {
  const { viewportMode } = useViewportMode();

  return (
    <main
      data-testid="app-page-container"
      data-viewport-mode={viewportMode}
      className={cn(
        'flex-1 w-full mx-auto space-y-4',
        APP_PAGE_CONTAINER_TOKENS[viewportMode],
        className
      )}
    >
      {children}
    </main>
  );
}
