import { type ViewportMode } from './getViewportMode';

export const APP_PAGE_CONTAINER_TOKENS: Record<ViewportMode, string> = {
  mobile: 'max-w-lg px-4 py-4',
  'tablet-portrait': 'max-w-4xl px-6 py-5',
  'tablet-landscape': 'max-w-6xl px-8 py-6',
  'desktop-or-other': 'max-w-6xl px-8 py-6',
};

export const TABLET_SECTION_GRID_TOKENS: Record<ViewportMode, string> = {
  mobile: 'grid-cols-1 gap-4',
  'tablet-portrait': 'grid-cols-2 gap-5',
  'tablet-landscape': 'grid-cols-2 gap-6',
  'desktop-or-other': 'grid-cols-2 gap-6',
};

export const TABLET_SHELL_TOKENS: Record<ViewportMode, string> = {
  mobile: '',
  'tablet-portrait': 'grid-cols-[4.5rem_minmax(0,1fr)]',
  'tablet-landscape': 'grid-cols-[15rem_minmax(0,1fr)]',
  'desktop-or-other': 'grid-cols-[15rem_minmax(0,1fr)]',
};
