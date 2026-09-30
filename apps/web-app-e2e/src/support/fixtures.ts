import { expect, test as base } from '@playwright/test';
import { resetDomain } from './reset/resetDomain';

/**
 * `test` for every e2e spec: before each test the local database is wiped and
 * seeded with the baseline (see `reset/baseline.ts`), so no test depends on
 * what an earlier one left behind.
 */
export const test = base.extend<{ cleanDomain: void }>({
  cleanDomain: [
    // Playwright reads this parameter to resolve fixtures, so it must be a destructuring pattern.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await resetDomain({ seed: true });
      await use();
    },
    { auto: true },
  ],
});

export { documented } from './testDoc';
export { expect };
