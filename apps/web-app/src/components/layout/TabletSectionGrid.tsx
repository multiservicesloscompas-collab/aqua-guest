import { type ReactNode } from 'react';

import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { TABLET_SECTION_GRID_TOKENS } from '@/lib/responsive/layoutTokens';
import { cn } from '@/lib/utils';

interface TabletSectionGridProps {
  children: ReactNode;
  className?: string;
}

export function TabletSectionGrid({
  children,
  className,
}: TabletSectionGridProps) {
  const { viewportMode } = useViewportMode();

  return (
    <section
      data-testid="tablet-section-grid"
      data-viewport-mode={viewportMode}
      className={cn(
        'grid',
        TABLET_SECTION_GRID_TOKENS[viewportMode],
        className
      )}
    >
      {children}
    </section>
  );
}
