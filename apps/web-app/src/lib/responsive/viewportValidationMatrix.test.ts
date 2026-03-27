import { describe, expect, it } from 'vitest';

import { getViewportMode } from './getViewportMode';

describe('viewport validation matrix (verify-ready)', () => {
  it.each([
    {
      label: 'mobile portrait lower range',
      input: { width: 360, height: 740, orientation: 'portrait' as const },
      expected: 'mobile',
    },
    {
      label: 'mobile landscape max boundary',
      input: { width: 767, height: 420, orientation: 'landscape' as const },
      expected: 'mobile',
    },
    {
      label: 'tablet portrait lower boundary',
      input: { width: 768, height: 1024, orientation: 'portrait' as const },
      expected: 'tablet-portrait',
    },
    {
      label: 'tablet portrait upper boundary (1023)',
      input: { width: 1023, height: 1366, orientation: 'portrait' as const },
      expected: 'tablet-portrait',
    },
    {
      label: 'iPad Pro portrait (1024×1366) — was incorrectly desktop-or-other',
      input: { width: 1024, height: 1366, orientation: 'portrait' as const },
      expected: 'tablet-portrait',
    },
    {
      label: 'tablet landscape lower boundary',
      input: { width: 1024, height: 768, orientation: 'landscape' as const },
      expected: 'tablet-landscape',
    },
    {
      label: 'tablet landscape upper boundary',
      input: { width: 1366, height: 900, orientation: 'landscape' as const },
      expected: 'tablet-landscape',
    },
    {
      label: 'mid-range tablet in landscape (900×700)',
      input: { width: 900, height: 700, orientation: 'landscape' as const },
      expected: 'tablet-landscape',
    },
    {
      label: 'desktop fallback over tablet upper bound',
      input: { width: 1367, height: 1024, orientation: 'landscape' as const },
      expected: 'desktop-or-other',
    },
    {
      label: 'desktop wide screen',
      input: { width: 1440, height: 900, orientation: 'landscape' as const },
      expected: 'desktop-or-other',
    },
  ])('$label', ({ input, expected }) => {
    expect(getViewportMode(input)).toBe(expected);
  });
});
