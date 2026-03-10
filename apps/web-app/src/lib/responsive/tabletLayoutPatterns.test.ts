import { describe, expect, it } from 'vitest';

import {
  TABLET_PRIMARY_COLUMN_CLASS,
  TABLET_PRIMARY_CONTROLS_FLOW_CLASS,
  TABLET_PRIMARY_LIST_FLOW_CLASS,
  TABLET_PRIMARY_COLUMN_COMPACT_CLASS,
  TABLET_SECONDARY_COMPLEMENTARY_CLASS,
  TABLET_SECONDARY_COLUMN_CLASS,
  TABLET_SECONDARY_COLUMN_COMPACT_CLASS,
  TABLET_SECONDARY_COLUMN_RELAXED_CLASS,
  TABLET_SPLIT_LAYOUT_CLASS,
} from './tabletLayoutPatterns';

describe('tabletLayoutPatterns tokens', () => {
  it('keeps canonical split baseline tokens', () => {
    expect(TABLET_SPLIT_LAYOUT_CLASS).toBe('items-start');
    expect(TABLET_PRIMARY_COLUMN_CLASS).toBe('space-y-4');
    expect(TABLET_PRIMARY_CONTROLS_FLOW_CLASS).toBe('space-y-4');
    expect(TABLET_PRIMARY_LIST_FLOW_CLASS).toBe('space-y-4');
    expect(TABLET_SECONDARY_COLUMN_CLASS).toBe('space-y-4 sticky top-20');
    expect(TABLET_SECONDARY_COMPLEMENTARY_CLASS).toBe(
      'space-y-4 sticky top-20'
    );
  });

  it('exposes compact and relaxed variants with stable sticky behavior', () => {
    expect(TABLET_PRIMARY_COLUMN_COMPACT_CLASS).toBe('space-y-3');
    expect(TABLET_SECONDARY_COLUMN_COMPACT_CLASS).toBe(
      'space-y-3 sticky top-20'
    );
    expect(TABLET_SECONDARY_COLUMN_RELAXED_CLASS).toBe(
      'space-y-6 sticky top-20'
    );
  });
});
