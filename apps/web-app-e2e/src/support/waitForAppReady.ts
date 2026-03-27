import { expect, type Page } from '@playwright/test';

const SHELL_READY_TEST_IDS = [
  'dashboard-kpi-mtd-income-value',
  'dashboard-primary-column',
  'tablet-navigation-rail',
] as const;

export async function waitForAppReady(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const pathname = new URL(page.url()).pathname;
        return pathname;
      },
      {
        timeout: 30_000,
        message: 'App did not resolve to dashboard route',
      }
    )
    .toBe('/');

  await expect
    .poll(
      async () => {
        for (const testId of SHELL_READY_TEST_IDS) {
          if ((await page.getByTestId(testId).count()) > 0) {
            return true;
          }
        }

        return false;
      },
      {
        timeout: 30_000,
        message: 'Dashboard shell readiness markers were not rendered',
      }
    )
    .toBe(true);
}
