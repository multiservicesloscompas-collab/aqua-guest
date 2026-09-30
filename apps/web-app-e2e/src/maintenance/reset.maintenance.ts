import { test } from '@playwright/test';
import { formatReport, resetDomain } from '../support/reset/resetDomain';

// Uses the plain Playwright `test` on purpose: the e2e fixture would reset the
// database a second time before this body runs.
test('reset the local e2e database', async () => {
  const seed = process.env.E2E_RESET_MODE !== 'purge';
  const dryRun = process.env.DRY_RUN === '1';

  const report = await resetDomain({ seed, dryRun });
  process.stdout.write(formatReport(report));
});
