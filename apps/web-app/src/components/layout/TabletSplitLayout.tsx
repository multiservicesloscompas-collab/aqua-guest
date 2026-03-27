import { type ReactNode } from 'react';

import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { cn } from '@/lib/utils';

interface TabletSplitLayoutProps {
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
}

export function TabletSplitLayout({
  primary,
  secondary,
  className,
}: TabletSplitLayoutProps) {
  const { viewportMode } = useViewportMode();
  const isTabletLandscape = viewportMode === 'tablet-landscape';

  return (
    <section
      data-testid="tablet-split-layout"
      data-viewport-mode={viewportMode}
      className={cn(
        'grid gap-4',
        isTabletLandscape
          ? 'grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6'
          : 'grid-cols-1',
        className
      )}
    >
      <div>{primary}</div>
      <aside>{secondary}</aside>
    </section>
  );
}
