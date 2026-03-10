import { describe, expect, it } from 'vitest';

import { getViewportMode } from './getViewportMode';

describe('getViewportMode', () => {
  it('returns mobile for widths smaller than 768px', () => {
    expect(getViewportMode({ width: 767, height: 900 })).toBe('mobile');
    expect(getViewportMode({ width: 375, height: 812 })).toBe('mobile');
  });

  it('returns tablet-portrait for standard tablet portrait (768–1023)', () => {
    expect(getViewportMode({ width: 768, height: 1024 })).toBe(
      'tablet-portrait'
    );
    expect(
      getViewportMode({ width: 1023, height: 1400, orientation: 'portrait' })
    ).toBe('tablet-portrait');
  });

  it('returns tablet-portrait for iPad Pro portrait (1024×1366)', () => {
    // iPad Pro 11" and 12.9" in portrait: width < height → portrait
    expect(getViewportMode({ width: 1024, height: 1366 })).toBe(
      'tablet-portrait'
    );
    expect(
      getViewportMode({ width: 1024, height: 1366, orientation: 'portrait' })
    ).toBe('tablet-portrait');
  });

  it('returns tablet-landscape for standard tablet landscape (1024–1366)', () => {
    expect(getViewportMode({ width: 1024, height: 768 })).toBe(
      'tablet-landscape'
    );
    expect(
      getViewportMode({ width: 1366, height: 900, orientation: 'landscape' })
    ).toBe('tablet-landscape');
  });

  it('returns tablet-landscape for iPad Pro landscape (1366×1024)', () => {
    expect(getViewportMode({ width: 1366, height: 1024 })).toBe(
      'tablet-landscape'
    );
  });

  it('returns tablet-landscape for mid-range landscape tablets in 768–1366', () => {
    expect(
      getViewportMode({ width: 900, height: 700, orientation: 'landscape' })
    ).toBe('tablet-landscape');
  });

  it('returns desktop-or-other for widths above 1366px', () => {
    expect(getViewportMode({ width: 1440, height: 900 })).toBe(
      'desktop-or-other'
    );
    expect(getViewportMode({ width: 1920, height: 1080 })).toBe(
      'desktop-or-other'
    );
  });
});
