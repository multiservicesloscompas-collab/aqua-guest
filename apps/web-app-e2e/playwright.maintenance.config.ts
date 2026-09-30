import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Config for the database maintenance commands (`npm run e2e:reset`,
 * `e2e:purge`). It has no browser and no web server: it only runs the
 * `*.maintenance.ts` files.
 */
export default defineConfig({
  testDir: path.join(__dirname, 'src/maintenance'),
  testMatch: '**/*.maintenance.ts',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'list',
});
