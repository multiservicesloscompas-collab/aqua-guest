import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const LOCAL_BASE_URL = 'http://localhost:4200';
const baseURL = process.env.E2E_BASE_URL ?? LOCAL_BASE_URL;
const configDir = __dirname;

const IPHONE_14_DEFAULTS = devices['iPhone 14'];

export default defineConfig({
  testDir: path.join(configDir, 'src/tests'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx nx serve web-app --host=localhost --port=4200',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
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
  ],
});
