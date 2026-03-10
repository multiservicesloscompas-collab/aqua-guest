import { useEffect, useState } from 'react';

import {
  getViewportModeFromWindow,
  type ViewportMode,
} from '@/lib/responsive/getViewportMode';

function getInitialViewportMode(): ViewportMode {
  if (typeof window === 'undefined') {
    return 'desktop-or-other';
  }

  return getViewportModeFromWindow(window);
}

export function useViewportMode() {
  const [viewportMode, setViewportMode] = useState<ViewportMode>(
    getInitialViewportMode
  );

  useEffect(() => {
    const onChange = () => {
      setViewportMode(getViewportModeFromWindow(window));
    };

    onChange();

    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);

    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  return {
    viewportMode,
    isMobileViewport: viewportMode === 'mobile',
    isTabletViewport:
      viewportMode === 'tablet-portrait' || viewportMode === 'tablet-landscape',
  };
}
