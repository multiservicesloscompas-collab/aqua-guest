import { test as base, expect } from '@playwright/test';
import { resetDomain } from './reset/resetDomain';

/**
 * `test` for every e2e spec: before each test the local database is wiped and
 * seeded with the baseline (see `reset/baseline.ts`), so no test depends on
 * what an earlier one left behind.
 */
export const test = base.extend<{ cleanDomain: void; navigationLog: void }>({
  cleanDomain: [
    // Playwright reads this parameter to resolve fixtures, so it must be a destructuring pattern.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await resetDomain({ seed: true });
      await use();
    },
    { auto: true },
  ],
  
  navigationLog: [
    async ({ page }, use, testInfo) => {
      const startedAt = Date.now();
      const events: string[] = [];
      const stamp = () => `+${Date.now() - startedAt}ms`;
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          events.push(`${stamp()} navigated ${frame.url()}`);
        }
      });
      page.on('console', (message) => {
        if (message.text().includes('[vite]')) {
          events.push(`${stamp()} ${message.text()}`);
        }
      });
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('navigation-log', {
          body: events.join('\n') || 'no navigation events',
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

export { documented } from './testDoc';
export { expect };

