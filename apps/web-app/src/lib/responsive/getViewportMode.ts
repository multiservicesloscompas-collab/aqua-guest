export type ViewportMode =
  | 'mobile'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'desktop-or-other';

export type ViewportOrientation = 'portrait' | 'landscape';

interface ViewportSnapshot {
  width: number;
  height: number;
  orientation?: ViewportOrientation;
}

const MOBILE_MAX_WIDTH = 767;
const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1366;

function getOrientation({ width, height, orientation }: ViewportSnapshot) {
  if (orientation) {
    return orientation;
  }

  return width > height ? 'landscape' : 'portrait';
}

export function getViewportMode(snapshot: ViewportSnapshot): ViewportMode {
  const { width } = snapshot;
  const resolvedOrientation = getOrientation(snapshot);

  if (width <= MOBILE_MAX_WIDTH) {
    return 'mobile';
  }

  // Tablet range: 768px – 1366px. Use orientation to decide collapsed vs expanded.
  // This correctly handles iPad Pro 1024×1366 (portrait) and 1366×1024 (landscape).
  if (width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH) {
    return resolvedOrientation === 'portrait'
      ? 'tablet-portrait'
      : 'tablet-landscape';
  }

  return 'desktop-or-other';
}

export function getViewportModeFromWindow(win: Window): ViewportMode {
  return getViewportMode({
    width: win.innerWidth,
    height: win.innerHeight,
  });
}
