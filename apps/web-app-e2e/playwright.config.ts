import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { DEFAULT_E2E_BASE_URL } from './src/support/env';

const baseURL = process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL;
const serverPort = new URL(baseURL).port || '80';
const configDir = __dirname;

const IPHONE_14_DEFAULTS = devices['iPhone 14'];

export default defineConfig({
  testDir: path.join(configDir, 'src/tests'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  // E2E_NARRATE=1 (set by `npm run e2e:live`) explains each test before and
  // after it runs; see src/reporters/narrator.ts.
  reporter:
    process.env.E2E_NARRATE === '1'
      ? [['./src/reporters/narrator.ts']]
      : process.env.CI
      ? 'line'
      : 'list',
  use: {
    baseURL,
    timezoneId: 'America/Caracas',
    locale: 'es-VE',
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npx nx serve web-app --host=localhost --port=${serverPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/bugs/**',
      use: {
        browserName: 'chromium',
        // Keep deterministic iPhone 14 defaults for local headed/debug runs.
        // `--headed` and `--debug` MUST inherit this profile unless explicitly overridden.
        ...IPHONE_14_DEFAULTS,
      },
      expect: {
        timeout: 15_000,
      },
    },
    {
      name: 'bugs',
      testMatch: '**/bugs/**/*.bugs.e2e.spec.ts',
      use: {
        browserName: 'chromium',
        ...IPHONE_14_DEFAULTS,
      },
      expect: {
        timeout: 8_000,
      },
    },
  ],
});
